/* eslint-disable @typescript-eslint/no-explicit-any */
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Customer, ServiceRecord, Vehicle } from "../../types";
import { logError, logInfo } from "../../utils/errorHandler";
import { servicesRepository } from "../repositories/servicesRepository";

const safe = (v: any, fb = "—") =>
  v === null || v === undefined || v === "" ? fb : String(v);

const money = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? "0.00" : n.toFixed(2);
};

const SCALE     = 2;          // html2canvas scale factor
const DOM_W     = 794;        // DOM width = A4 width equivalent

/**
 * Given all measured element positions (in canvas px), compute where to slice
 * the canvas so that no element is cut through the middle.
 *
 * Strategy: start at each A4-height boundary; if any unbreakable element
 * straddles that boundary, move the cut to just above that element.
 */
function smartCuts(
  noBreakEls: { top: number; bottom: number }[],
  a4H: number,
  canvasHeight: number,
): number[] {
  const cuts: number[] = [];
  let prevCut = 0;
  let targetY = a4H;

  while (targetY < canvasHeight) {
    let cutY = targetY;

    for (const el of noBreakEls) {
      if (el.top < cutY && el.bottom > cutY) {
        const candidate = el.top - 4;
        // Only accept the early cut if it still leaves a meaningful page
        if (candidate > prevCut + a4H * 0.15) {
          cutY = Math.min(cutY, candidate);
        }
      }
    }

    cuts.push(cutY);
    prevCut  = cutY;
    targetY  = cutY + a4H;
  }

  cuts.push(canvasHeight); // final slice
  return cuts;
}

export const exportWorkOrderPdf = async (
  customer: Customer,
  vehicle: Vehicle,
  recordId: string,
): Promise<void> => {
  try {
    logInfo("Generating PDF for:", recordId);

    const fresh = await servicesRepository.getService(recordId);
    if (!fresh) throw new Error("Service record not found");
    const record = fresh as unknown as ServiceRecord;

    const services =
      Array.isArray(record.services) && record.services.length > 0
        ? record.services
        : [{ description: safe(record.description, "Εργασία"), quantity: 1, unit_price: 0 }];

    // ── 1. Mount the HTML ──────────────────────────────────────────────────
    const container = document.createElement("div");
    container.innerHTML = generateFullHTML(customer, vehicle, record, services);
    Object.assign(container.style, {
      position:  "absolute",
      left:      "50%",
      top:       "0",
      transform: "translateX(-50%)",
      width:     `${DOM_W}px`,
      height:    "auto",
    });
    document.body.appendChild(container);

    // Wait for fonts / images to settle
    await new Promise((r) => setTimeout(r, 350));

    // ── 2. Measure element positions while DOM is live ─────────────────────
    const cRect = container.getBoundingClientRect();

    const noBreakEls = [
      // Every service row must not be cut
      ...Array.from(container.querySelectorAll<HTMLElement>("tbody tr")),
      // Named sections that must not be cut
      ...Array.from(container.querySelectorAll<HTMLElement>("[data-nobreak]")),
    ].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        top:    (r.top    - cRect.top) * SCALE,
        bottom: (r.bottom - cRect.top) * SCALE,
      };
    });

    // ── 3. Capture full-length canvas ──────────────────────────────────────
    const canvas = await html2canvas(container, {
      scale:           SCALE,
      backgroundColor: "#ffffff",
      useCORS:         true,
      allowTaint:      false,
    });

    container.remove();

    // ── 4. Compute smart cut points ────────────────────────────────────────
    const a4H  = (297 / 210) * canvas.width; // A4 height in canvas pixels
    const cuts = smartCuts(noBreakEls, a4H, canvas.height);

    // ── 5. Slice into PDF pages ────────────────────────────────────────────
    const pdf  = new jsPDF("p", "mm", "a4");
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    let srcY      = 0;
    let firstPage = true;

    for (const cutY of cuts) {
      const sliceH = cutY - srcY;
      if (sliceH <= 0) continue;

      // Always paint onto a full A4-height canvas (remainder stays white)
      const slice = document.createElement("canvas");
      slice.width  = canvas.width;
      slice.height = Math.ceil(a4H);
      const ctx = slice.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH,
                            0, 0,   canvas.width, sliceH);

      if (!firstPage) pdf.addPage();
      pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pdfW, pdfH);

      srcY      = cutY;
      firstPage = false;
    }

    pdf.save(`work-order-${recordId}.pdf`);
    logInfo("PDF created successfully.");
  } catch (err) {
    logError("PDF generation failed:", err);
    alert("Παρουσιάστηκε σφάλμα κατά τη δημιουργία PDF.");
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HTML template — single flowing document, browser handles Greek fonts
// Add data-nobreak to every block that must never be sliced mid-element
// ─────────────────────────────────────────────────────────────────────────────
function generateFullHTML(
  customer: Customer,
  vehicle: Vehicle,
  record: ServiceRecord,
  services: any[],
): string {
  const date = new Date().toLocaleDateString("el-GR");

  const rows = services
    .map((s, i) => {
      const qty   = Number(s.quantity)   || 1;
      const price = Number(s.unit_price) || 0;
      const total = qty * price;
      const qtyStr = qty % 1 === 0 ? String(qty) : String(parseFloat(qty.toFixed(4)));
      return `
        <tr>
          <td style="text-align:center;color:#9ca3af;">${i + 1}</td>
          <td>${safe(s.description)}</td>
          <td style="text-align:center;">${qtyStr}</td>
          <td style="text-align:right;">${money(price)}€</td>
          <td style="text-align:right;font-weight:700;">${money(total)}€</td>
        </tr>`;
    })
    .join("");

  const hasNotes = record.notes && record.notes.trim();

  return `
<style>
* { margin:0; padding:0; box-sizing:border-box; }

.wrap {
  width: 794px;
  padding: 28px 28px 44px;
  background: #fff;
  color: #1f2937;
  font-family: Arial, sans-serif;
  font-size: 13px;
  line-height: 1.55;
}

/* Header */
.header {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding-bottom: 18px;
  border-bottom: 3px solid #ef4444;
  margin-bottom: 22px;
}
.logo { width: 95px; height: auto; flex-shrink: 0; }
.hc  { flex: 1; text-align: center; }
.co-name { font-size: 22px; font-weight: 700; color: #ef4444; margin-bottom: 3px; }
.co-sub  { font-size: 11.5px; font-weight: 700; color: #4b5563; margin-bottom: 4px; }
.co-info { font-size: 11px; color: #6b7280; margin-bottom: 10px; line-height: 1.6; }
.doc-title { font-size: 18px; font-weight: 700; color: #111827; }
.doc-date  { font-size: 12px; color: #6b7280; margin-top: 3px; }

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 22px;
}
.box {
  background: #f8fafc;
  border-left: 4px solid #ef4444;
  border-radius: 6px;
  padding: 12px 14px;
}
.box-title {
  font-size: 13px; font-weight: 700; color: #ef4444;
  border-bottom: 1px solid #fca5a5;
  padding-bottom: 5px; margin-bottom: 9px;
}
.field { font-size: 12px; margin-bottom: 5px; display: flex; gap: 6px; }
.field b { width: 78px; flex-shrink: 0; color: #374151; }
.field span { color: #6b7280; }

/* Section title */
.sec-title {
  font-size: 14px; font-weight: 700; color: #111827;
  border-bottom: 2px solid #ef4444;
  padding-bottom: 5px; margin-bottom: 11px;
}

/* Services table */
.st {
  width: 100%; border-collapse: collapse;
  font-size: 12.5px; margin-bottom: 24px;
}
.st th {
  background: #ef4444; color: #fff;
  padding: 9px 8px; text-align: left; font-weight: 700;
}
.st td { padding: 8px 8px; border-bottom: 1px solid #e5e7eb; }
.st tr:nth-child(even) td { background: #f9fafb; }

/* Notes */
.notes-box {
  background: #f8fafc;
  border-left: 4px solid #ef4444;
  border-radius: 6px;
  padding: 12px 14px 14px;
  font-size: 12.5px;
  white-space: pre-wrap;
  line-height: 1.75;
  color: #1f2937;
  margin-bottom: 20px;
}

/* Totals */
.totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 30px; }
.totals-box {
  background: #f1f5f9;
  border: 1px solid #dde4ee;
  border-radius: 8px;
  padding: 14px 20px;
  min-width: 210px;
}
.total-row-final {
  display: flex; justify-content: space-between;
  font-size: 16px; font-weight: 700; color: #111827;
  border-top: 2px solid #ef4444;
  padding-top: 9px; margin-top: 4px;
}

/* Footer */
.footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
  text-align: center;
  font-size: 10px; color: #9ca3af;
}
.disclaimer {
  margin-top: 7px; font-size: 9px; color: #b0b7c3;
  font-style: italic; line-height: 1.55;
}
</style>

<div class="wrap">

  <!-- Header (never broken) -->
  <div class="header" data-nobreak>
    <img src="/screenshot_2025-12-04_155357.png" class="logo" alt="Logo" />
    <div class="hc">
      <div class="co-name">Karabetsos I. Karabetsos L.</div>
      <div class="co-sub">ΓΕΝΙΚΟ ΣΥΝΕΡΓΕΙΟ / ΗΛΕΚΤΡΟΛΟΓΕΙΟ</div>
      <div class="co-info">
        Τηλ: 2106611800 &nbsp;|&nbsp; ΑΦΜ 802705280 &nbsp;|&nbsp; ΔΟΥ: ΚΕΦΟΔΕ ΑΤΤΙΚΗΣ<br>
        Διεύθυνση: ΕΥΒΟΙΑΣ 15, ΓΕΡΑΚΑΣ 15344
      </div>
      <div class="doc-title">Εντολή Εργασίας</div>
      <div class="doc-date">${date}</div>
    </div>
  </div>

  <!-- Info boxes (never broken) -->
  <div class="info-grid" data-nobreak>
    <div class="box">
      <div class="box-title">Στοιχεία Πελάτη</div>
      <div class="field"><b>Όνομα:</b>     <span>${safe(customer.name)}</span></div>
      <div class="field"><b>Τηλέφωνο:</b>  <span>${safe(customer.phone)}</span></div>
      <div class="field"><b>Email:</b>      <span>${safe(customer.email)}</span></div>
      <div class="field"><b>Διεύθυνση:</b> <span>${safe(customer.address)}</span></div>
      <div class="field"><b>ΑΦΜ:</b>       <span>${safe(customer.afm)}</span></div>
    </div>
    <div class="box">
      <div class="box-title">Στοιχεία Οχήματος</div>
      <div class="field"><b>Μάρκα:</b>    <span>${safe(vehicle.make)}</span></div>
      <div class="field"><b>Μοντέλο:</b>  <span>${safe(vehicle.model)}</span></div>
      <div class="field"><b>Έτος:</b>     <span>${safe(vehicle.year)}</span></div>
      <div class="field"><b>Πινακίδα:</b> <span>${safe(vehicle.license_plate)}</span></div>
      <div class="field"><b>VIN:</b>       <span>${safe(vehicle.vin)}</span></div>
      <div class="field"><b>Χιλ/τρα:</b>  <span>${safe(record.mileage)}</span></div>
    </div>
  </div>

  <!-- Services (each <tr> is measured individually by smartCuts) -->
  <div class="sec-title">Εργασίες</div>
  <table class="st">
    <thead>
      <tr data-nobreak>
        <th style="width:38px;text-align:center;">Α/Α</th>
        <th>Περιγραφή</th>
        <th style="width:56px;text-align:center;">Ποσ.</th>
        <th style="width:96px;text-align:right;">Τιμή/Μον.</th>
        <th style="width:88px;text-align:right;">Σύνολο</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Notes — data-nobreak keeps it whole when it fits on current page -->
  ${hasNotes ? `
  <div data-nobreak>
    <div class="sec-title">Παρατηρήσεις</div>
    <div class="notes-box">${safe(record.notes)}</div>
  </div>` : ""}

  <!-- Totals — never broken -->
  <div class="totals-wrap" data-nobreak>
    <div class="totals-box">
      <div class="total-row-final">
        <span>ΣΥΝΟΛΟ:</span>
        <span>${money(record.total)}€</span>
      </div>
    </div>
  </div>

  <!-- Footer — never broken -->
  <div class="footer" data-nobreak>
    <div>Εντολή Εργασίας ID: ${record.id} &nbsp;|&nbsp; Ημερομηνία: ${date}</div>
    <div class="disclaimer">
      Το παρόν έγγραφο αποτελεί δελτίο/σύνοψη εργασιών και εκδίδεται αποκλειστικά για ενημερωτικούς σκοπούς.
      Δεν αποτελεί νόμιμη απόδειξη, τιμολόγιο ή άλλο φορολογικό παραστατικό.
    </div>
  </div>

</div>`;
}
