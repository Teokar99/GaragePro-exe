import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Customer, ServiceRecord, Vehicle } from "../../types";
import { logError, logInfo } from "../../utils/errorHandler";
import { servicesRepository } from "../repositories/servicesRepository";

export const exportWorkOrderPdf = async (
  customer: Customer,
  vehicle: Vehicle,
  recordId: string
): Promise<void> => {
  try {
    logInfo("Generating PDF for:", recordId);

    const freshRecord = await servicesRepository.getService(recordId);

    if (!freshRecord) throw new Error("Service record not found");

    const record = freshRecord as unknown as ServiceRecord;

    const servicesArray =
      Array.isArray(record.services) && record.services.length > 0
        ? record.services
        : [
            {
              description: safe(record.description, "Εργασία"),
              quantity: 1,
              unit_price: 0,
            },
          ];

    // Split services into chunks of 10
    const SERVICES_PER_PAGE = 10;
    const serviceChunks: any[][] = [];
    for (let i = 0; i < servicesArray.length; i += SERVICES_PER_PAGE) {
      serviceChunks.push(servicesArray.slice(i, i + SERVICES_PER_PAGE));
    }

    const pages: HTMLDivElement[] = [];
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    let isFirstPage = true;

    // Create page 1 with customer, vehicle, and first 10 services
    const page1Wrapper = document.createElement("div");
    page1Wrapper.innerHTML = generatePage1HTML(customer, vehicle, record, serviceChunks[0]);
    page1Wrapper.style.position = "absolute";
    page1Wrapper.style.left = "50%";
    page1Wrapper.style.top = "0";
    page1Wrapper.style.transform = "translateX(-50%)";
    page1Wrapper.style.height = "auto";
    page1Wrapper.style.minHeight = "1400px";
    page1Wrapper.style.display = "block";
    document.body.appendChild(page1Wrapper);
    pages.push(page1Wrapper);

    // Create additional pages for remaining services (if any)
    for (let i = 1; i < serviceChunks.length; i++) {
      const pageWrapper = document.createElement("div");
      pageWrapper.innerHTML = generateServicesPageHTML(serviceChunks[i], i * SERVICES_PER_PAGE, record);
      pageWrapper.style.position = "absolute";
      pageWrapper.style.left = "50%";
      pageWrapper.style.top = `${i * 1500}px`;
      pageWrapper.style.transform = "translateX(-50%)";
      pageWrapper.style.height = "auto";
      pageWrapper.style.minHeight = "1400px";
      pageWrapper.style.display = "block";
      document.body.appendChild(pageWrapper);
      pages.push(pageWrapper);
    }

    // Create final page with notes and totals
    const finalPageWrapper = document.createElement("div");
    finalPageWrapper.innerHTML = generatePage2HTML(record);
    finalPageWrapper.style.position = "absolute";
    finalPageWrapper.style.left = "50%";
    finalPageWrapper.style.top = `${serviceChunks.length * 1500}px`;
    finalPageWrapper.style.transform = "translateX(-50%)";
    finalPageWrapper.style.height = "auto";
    finalPageWrapper.style.minHeight = "1400px";
    finalPageWrapper.style.display = "block";
    document.body.appendChild(finalPageWrapper);
    pages.push(finalPageWrapper);

    await new Promise((res) => setTimeout(res, 250));

    // Capture and add all pages to PDF
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      if (!isFirstPage) {
        pdf.addPage();
      }

      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      isFirstPage = false;
    }

    pdf.save(`work-order-${recordId}.pdf`);

    pages.forEach(page => page.remove());
    logInfo("PDF created successfully.");
  } catch (err) {
    logError("PDF generation failed:", err);
    alert("Παρουσιάστηκε σφάλμα κατά τη δημιουργία PDF.");
    throw err;
  }
};

const safe = (value: any, fallback = "—") =>
  value === null || value === undefined || value === "" ? fallback : value;

const money = (value: any) => {
  const num = Number(value);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

function generatePage1HTML(
  customer: Customer,
  vehicle: Vehicle,
  record: ServiceRecord,
  services: any[]
): string {
  const currentDate = new Date().toLocaleDateString("el-GR");

  const servicesRows = services
    .map((s, i) => {
      const qty = Number(s.quantity) || 1;
      const price = Number(s.unit_price) || 0;
      const total = qty * price;

      return `
        <tr>
          <td>${i + 1}</td>
          <td>${safe(s.description)}</td>
          <td style="text-align:center;">${qty}</td>
          <td style="text-align:right;">${money(price)}€</td>
          <td style="text-align:right;font-weight:600;">${money(total)}€</td>
        </tr>
      `;
    })
    .join("");

  return `
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

.pdf-container {
  font-family: Arial, sans-serif;
  width: 794px;
  min-height: 1123px;
  padding: 20px;
  background: #fff;
  color: #333;
  line-height: 1.6;
  font-size: 14px;
}

.header {
  text-align: center;
  position: relative;
  margin-bottom: 30px;
  border-bottom: 3px solid #ef4444;

  padding-bottom: 20px;
}

.logo {
  width: 200px;
  height: auto;
  margin-bottom: 15px;
  position: absolute;
  top: 0;
  left: 0;
}
.company-name {
  font-size: 24px;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 8px;
}

.company-details {
  font-size: 12px;
  color: #666;
  margin-bottom: 15px;
}

.work-order-title {
  font-size: 20px;
  font-weight: 700;
  margin-top: 10px;
}

.date {
  font-size: 14px;
  color: #6b7280;
  margin-top: 5px;
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 25px;
}

.section {
  background: #f8fafc;
  padding: 15px;
  border-radius: 8px;

  border-left: 4px solid #ef4444;
}

.section-title {
  font-size: 16px;
  font-weight: 700; /* was 600 */
  color: #ef4444;
  margin-bottom: 15px;
  border-bottom: 1px solid #ef4444;
  padding-bottom: 5px;
}

.field {
  margin-bottom: 8px;
  font-size: 13px;
}

.field-label {
  display: inline-block;
  width: 100px;
  font-weight: 500;
  color: #374151;
}

.field-value {
  color: #6b7280;
}

.services-section {
  grid-column: 1 / -1;
  margin-top: 15px;
}

.services-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  font-size: 13px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.services-table th {
  background: #ef4444;
  color: white;
  padding: 10px 8px;
  text-align: left;
}

.services-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #e2e8f0;
}

.services-table tr:nth-child(even) {
  background: #f8fafc;
}

.footer {
  margin-top: 30px;
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
  border-top: 1px solid #e2e8f0;
  padding-top: 15px;
}

.disclaimer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e2e8f0;
  font-size: 10px;
  color: #6b7280;
  line-height: 1.5;
  text-align: center;
  font-style: italic;
}
</style>

<div class="pdf-container" lang="el">

  <div class="header">
    <img src="/screenshot_2025-12-04_155357.png" alt="Carabetsos Logo" class="logo" />
    <div class="company-name">Karabetsos I. Karabetsos L.</div>
    <div style="font-size: 14px; color: #666; margin-bottom: 10px; font-weight: 600;">
      ΓΕΝΙΚΟ ΣΥΝΕΡΓΕΙΟ / ΗΛΕΚΤΡΟΛΟΓΕΙΟ
    </div>
    <div class="company-details">
      Τηλ: 802705280 | Κιν: 2106611800 | Email: carabetsos@yahoo.com<br>
      Διεύθυνση: Αγίας 15, Αθήνα, 15344
    </div>
    <div class="work-order-title">Εντολή Εργασίας</div>
    <div class="date">${currentDate}</div>
  </div>

  <div class="content">

    <div class="section">
      <div class="section-title">Στοιχεία Πελάτη</div>
      <div class="field"><span class="field-label">Όνομα:</span>
        <span class="field-value">${safe(customer.name)}</span></div>

      <div class="field"><span class="field-label">Τηλέφωνο:</span>
        <span class="field-value">${safe(customer.phone)}</span></div>

      <div class="field"><span class="field-label">Email:</span>
        <span class="field-value">${safe(customer.email)}</span></div>

      <div class="field"><span class="field-label">Διεύθυνση:</span>
        <span class="field-value">${safe(customer.address)}</span></div>

      <div class="field"><span class="field-label">ΑΦΜ:</span>
        <span class="field-value">${safe(customer.afm)}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Στοιχεία Οχήματος</div>

      <div class="field"><span class="field-label">Μάρκα:</span>
        <span class="field-value">${safe(vehicle.make)}</span></div>

      <div class="field"><span class="field-label">Μοντέλο:</span>
        <span class="field-value">${safe(vehicle.model)}</span></div>

      <div class="field"><span class="field-label">Έτος:</span>
        <span class="field-value">${safe(vehicle.year)}</span></div>

      <div class="field"><span class="field-label">Πινακίδα:</span>
        <span class="field-value">${safe(vehicle.license_plate)}</span></div>

      <div class="field"><span class="field-label">VIN:</span>
        <span class="field-value">${safe(vehicle.vin)}</span></div>

      <div class="field"><span class="field-label">Χιλιόμετρα:</span>
        <span class="field-value">${safe(record.mileage)}</span></div>
    </div>

    <div class="section services-section">
      <div class="section-title">Εργασίες</div>

      <table class="services-table">
        <thead>
          <tr>
            <th>Α/Α</th>
            <th>Περιγραφή</th>
            <th style="text-align:center;">Ποσότητα</th>
            <th style="text-align:right;">Τιμή Μονάδας</th>
            <th style="text-align:right;">Σύνολο</th>
          </tr>
        </thead>
        <tbody>
          ${servicesRows}
        </tbody>
      </table>
    </div>


  </div>

  <div class="footer">
    <p>Αυτό το έγγραφο δημιουργήθηκε αυτόματα από το σύστημα διαχείρισης εργασιών.</p>
    <p>Εντολή Εργασίας ID: ${record.id}</p>
    <p>Ημερομηνία Δημιουργίας: ${currentDate}</p>
    <div class="disclaimer">Το παρόν έγγραφο αποτελεί δελτίο/σύνοψη εργασιών και εκδίδεται αποκλειστικά για ενημερωτικούς σκοπούς. Δεν αποτελεί νόμιμη απόδειξη, τιμολόγιο ή άλλο φορολογικό παραστατικό.</div>
  </div>
</div>
`;
}

function generateServicesPageHTML(
  services: any[],
  startIndex: number,
  record: ServiceRecord
): string {
  const currentDate = new Date().toLocaleDateString("el-GR");

  const servicesRows = services
    .map((s, i) => {
      const qty = Number(s.quantity) || 1;
      const price = Number(s.unit_price) || 0;
      const total = qty * price;

      return `
        <tr>
          <td>${startIndex + i + 1}</td>
          <td>${safe(s.description)}</td>
          <td style="text-align:center;">${qty}</td>
          <td style="text-align:right;">${money(price)}€</td>
          <td style="text-align:right;font-weight:600;">${money(total)}€</td>
        </tr>
      `;
    })
    .join("");

  return `
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

.pdf-container {
  font-family: Arial, sans-serif;
  width: 794px;
  min-height: 1123px;
  padding: 20px;
  background: #fff;
  color: #333;
  line-height: 1.6;
  font-size: 14px;
}

.header {
  text-align: center;
  position: relative;
  margin-bottom: 30px;
  border-bottom: 2px solid #ef4444;
  padding-bottom: 15px;
}

.logo {
  width: 150px;
  height: auto;
  margin-bottom: 10px;
  position: absolute;
  top: 0;
  left: 0;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 5px;
}

.date {
  font-size: 14px;
  color: #6b7280;
}

.section {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #ef4444;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 15px;
  border-bottom: 1px solid #ef4444;
  padding-bottom: 5px;
}

.services-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  font-size: 13px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.services-table th {
  background: #ef4444;
  color: white;
  padding: 10px 8px;
  text-align: left;
}

.services-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #e2e8f0;
}

.services-table tr:nth-child(even) {
  background: #f8fafc;
}

.footer {
  margin-top: 30px;
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
  border-top: 1px solid #e2e8f0;
  padding-top: 15px;
}

.disclaimer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e2e8f0;
  font-size: 10px;
  color: #6b7280;
  line-height: 1.5;
  text-align: center;
  font-style: italic;
}
</style>

<div class="pdf-container" lang="el">
  <div class="header">
    <img src="/screenshot_2025-12-04_155357.png" alt="Carabetsos Logo" class="logo" />
    <div class="page-title">Εντολή Εργασίας - Εργασίες (Συνέχεια)</div>
    <div class="date">${currentDate}</div>
  </div>

  <div class="section">
    <div class="section-title">Εργασίες (Συνέχεια)</div>
    <table class="services-table">
      <thead>
        <tr>
          <th>Α/Α</th>
          <th>Περιγραφή</th>
          <th style="text-align:center;">Ποσότητα</th>
          <th style="text-align:right;">Τιμή Μονάδας</th>
          <th style="text-align:right;">Σύνολο</th>
        </tr>
      </thead>
      <tbody>
        ${servicesRows}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Εντολή Εργασίας ID: ${record.id}</p>
    <p>Ημερομηνία Δημιουργίας: ${currentDate}</p>
    <div class="disclaimer">Το παρόν έγγραφο αποτελεί δελτίο/σύνοψη εργασιών και εκδίδεται αποκλειστικά για ενημερωτικούς σκοπούς. Δεν αποτελεί νόμιμη απόδειξη, τιμολόγιο ή άλλο φορολογικό παραστατικό.</div>
  </div>
</div>
`;
}

function generatePage2HTML(record: ServiceRecord): string {
  const currentDate = new Date().toLocaleDateString("el-GR");

  return `
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

.pdf-container {
  font-family: Arial, sans-serif;
  width: 794px;
  min-height: 1123px;
  padding: 20px;
  background: #fff;
  color: #333;
  line-height: 1.6;
  font-size: 14px;
}

.header {
  text-align: center;
  position: relative;
  margin-bottom: 30px;

  border-bottom: 2px solid #ef4444;

  padding-bottom: 15px;
}

.logo {
  width: 150px;
  height: auto;
  margin-bottom: 10px;
  position: absolute;
  top: 0;
  left: 0;
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 5px;
}

.date {
  font-size: 14px;
  color: #6b7280;
}

.section {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #ef4444;

  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;


  margin-bottom: 15px;
  border-bottom: 1px solid #ef4444;
  padding-bottom: 5px;
}

.notes-content {
  font-weight: 700; 
  color: #374151;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  min-height: 400px;
  font-size: 14px;
  white-space: pre-wrap;
  line-height: 1.8;
}

.totals-section {
  margin-top: 30px;
  margin-bottom: 30px;
  display: flex;
  justify-content: flex-end;
}

.totals-box {
  background: #f1f5f9;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  min-width: 250px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 13px;
}

.total-row.final {
  border-top: 2px solid #ef4444;
  padding-top: 8px;
  margin-top: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #111111;
}

.totals-box span {
  color: #111;
}

.footer {
  margin-top: 30px;
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
  border-top: 1px solid #e2e8f0;
  padding-top: 15px;
}

.disclaimer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e2e8f0;
  font-size: 10px;
  color: #6b7280;
  line-height: 1.5;
  text-align: center;
  font-style: italic;
}
</style>

<div class="pdf-container" lang="el">
  <div class="header">
    <img src="/screenshot_2025-12-04_155357.png" alt="Carabetsos Logo" class="logo" />
    <div class="page-title">Εντολή Εργασίας - Παρατηρήσεις (Σελίδα 2)</div>
    <div class="date">${currentDate}</div>
  </div>

  <div class="section">
    <div class="section-title">Παρατηρήσεις</div>
    <div class="notes-content">${safe(record.notes)}</div>
  </div>

  <div class="totals-section">
    <div class="totals-box">
      <div class="total-row">
        <span>Υποσύνολο:</span>
        <span>${money(record.subtotal)}€</span>
      </div>
      <div class="total-row">
        <span>ΦΠΑ 24%:</span>
        <span>${money(record.vat)}€</span>
      </div>
      <div class="total-row final">
        <span>ΣΥΝΟΛΟ:</span>
        <span>${money(record.total)}€</span>
      </div>
    </div>
  </div>
  <div class="footer">
    <p>Εντολή Εργασίας ID: ${record.id} - Σελίδα 2</p>
    <p>Ημερομηνία Δημιουργίας: ${currentDate}</p>
    <div class="disclaimer">Το παρόν έγγραφο αποτελεί δελτίο/σύνοψη εργασιών και εκδίδεται αποκλειστικά για ενημερωτικούς σκοπούς. Δεν αποτελεί νόμιμη απόδειξη, τιμολόγιο ή άλλο φορολογικό παραστατικό.</div>
  </div>
</div>
`;
}
