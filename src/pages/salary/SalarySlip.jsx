import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { salaryService } from "../../api/salaryService";

const SalarySlip = () => {
  const { workerId, year, month } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);

  // Editable Fields State
  const [inputs, setInputs] = useState({
    etisalatBalance: 26.25,
    lastMonthBalance: 0,
    advance: 0,
    c3Pay: 0,
    absentDays: 0,
    noDutyDays: 0,
    sickLeaveDays: 0,
  });

  // --- 1. Fetch Slip Data ---
  const fetchSlip = async () => {
    setLoading(true);
    try {
      const res = await salaryService.getSlip(workerId, year, month);
      setData(res);
      setInputs({
        etisalatBalance: res.etisalatBalance,
        lastMonthBalance: res.lastMonthBalance,
        advance: res.advance,
        c3Pay: res.c3Pay,
        absentDays: res.absentDays,
        noDutyDays: res.noDutyDays,
        sickLeaveDays: res.sickLeaveDays,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load salary details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlip();
  }, [workerId, year, month]);

  // --- 2. Live Calculation Helper ---
  const calculateLiveTotals = () => {
    if (!data) return { totalCredit: 0, closingBalance: 0 };

    const totalCredit =
      Number(inputs.etisalatBalance) +
      Number(inputs.lastMonthBalance) +
      Number(inputs.advance) +
      Number(inputs.c3Pay);

    const closingBalance = Number(data.totalDebit) - totalCredit;

    return {
      totalCredit: totalCredit.toFixed(2),
      closingBalance: closingBalance.toFixed(2),
    };
  };

  const { totalCredit, closingBalance } = calculateLiveTotals();

  // --- 3. Save Handler ---
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        workerId,
        month: Number(month),
        year: Number(year),
        manualInputs: inputs,
      };
      await salaryService.saveSlip(payload);
      toast.success("Slip Saved Successfully");
      fetchSlip();
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // --- 4. Generate PDF (FIXED LAYOUT) ---
  const handleDownloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();

    const monthName = new Date(year, month).toLocaleString("default", {
      month: "long",
    });
    const fullDate = `${monthName}/${String(year).slice(-2)}`;

    // --- Header Box ---
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 270); // Main Page Border

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("BABA CAR WASHING AND CLEANING LLC", 105, 18, { align: "center" });
    doc.line(10, 22, 200, 22);

    // Employee Details
    doc.setFontSize(10);
    const nameText = `Employee Name : ${data.employeeName}`;
    doc.text(nameText, 12, 28);

    // Calculate position for Employee Code dynamically
    const nameWidth = doc.getTextWidth(nameText);
    const codeX = 12 + nameWidth + 10; // Start 10 units after the name ends
    doc.text(`Employee Code : ${data.employeeCode}`, codeX, 28);

    doc.text(`${fullDate} Salary`, 198, 28, { align: "right" });

    doc.line(10, 32, 200, 32);

    // --- Table Header ---
    doc.setFillColor(230, 230, 230);
    doc.rect(10, 32, 190, 8, "F");
    doc.line(10, 40, 200, 40);

    // Column Positions
    const xDate = 25;
    const xPart = 42;

    doc.text("Date", xDate, 37, { align: "center" });
    doc.text("Particulars", 100, 37, { align: "center" });
    doc.text("Debit", 170, 37, { align: "center" });
    doc.text("Credit", 190, 37, { align: "center" });

    // --- Rows ---
    let y = 48;
    const rowHeight = 8;

    const drawRow = (text, debit, credit) => {
      doc.setFont("helvetica", "normal");

      // Particulars
      doc.text(text, xPart, y);

      // Debit
      if (debit) {
        doc.text("Dr", 162, y); // Small Label
        doc.text(String(debit), 178, y, { align: "right" }); // Value
      }

      // Credit
      if (credit) {
        doc.text("Cr", 182, y); // Small Label
        doc.text(String(credit), 198, y, { align: "right" }); // Value
      }

      y += rowHeight;
      doc.line(10, y - 5, 200, y - 5); // Row Separator
    };

    // 1. Basic Salary (Dynamic)
    drawRow(`${fullDate} BASIC SALARY`, data.basicSalary, null);

    // 2. Extra Work
    drawRow("EXTRA WORK AND OT", data.extraWorkOt, null);

    // 3. Extra Payment
    drawRow("EXTRA PAYMENT", data.extraPaymentIncentive, null);

    // 4. Etisalat
    drawRow("ETISALAT SIM BALANCE", null, inputs.etisalatBalance);

    // 5. Last Month
    drawRow(
      "LAST MONTH BALANCE",
      null,
      inputs.lastMonthBalance > 0 ? inputs.lastMonthBalance : null,
    );

    // 6. Advance
    doc.text("ADVANCE", 12, y);
    drawRow("", null, inputs.advance > 0 ? inputs.advance : null);

    // 7. C3 Pay
    drawRow("C3 PAY", null, inputs.c3Pay > 0 ? inputs.c3Pay : null);

    // --- TOTALS ---
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", xPart, y);
    doc.text(String(data.totalDebit), 178, y, { align: "right" });
    doc.text(String(totalCredit), 198, y, { align: "right" });
    y += rowHeight;
    doc.line(10, y - 5, 200, y - 5);

    // Closing Balance
    doc.text("CLOSING BALANCE", xPart, y);
    doc.text(String(closingBalance), 198, y, { align: "right" });
    y += rowHeight;
    doc.line(10, y - 5, 200, y - 5);

    // Disclaimer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const disclaimer =
      "You must keep an accurate record; if we discover that you are doing cars without recording them, you will be fined.";
    doc.text(disclaimer, xPart, y, { maxWidth: 110 });

    // Repeated Closing Balance for clarity
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(String(closingBalance), 178, y + 4, { align: "right" });
    doc.text(String(closingBalance), 198, y + 4, { align: "right" });

    const mainTableBottomY = y + 8;
    doc.line(40, 32, 40, mainTableBottomY);
    doc.line(160, 32, 160, mainTableBottomY);
    doc.line(180, 32, 180, mainTableBottomY);
    doc.line(10, mainTableBottomY, 200, mainTableBottomY); // Bottom line of the table

    y = mainTableBottomY + 5;

    // --- Daily Breakdown Table ---
    const daysInMonth = data.daysInMonth || 31;
    const daysRow = Array.from({ length: daysInMonth }, (_, i) =>
      (i + 1).toString(),
    );
    const countsRow = Array.from(
      { length: daysInMonth },
      (_, i) => data.dailyData[i + 1] || 0,
    );

    daysRow.push("TOTAL");
    countsRow.push(data.totalWashes);

    autoTable(doc, {
      startY: y,
      head: [daysRow],
      body: [countsRow],
      theme: "grid",
      styles: { fontSize: 6, halign: "center", cellPadding: 1, lineColor: 0 },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        fontStyle: "bold",
        lineWidth: 0.1,
      },
      bodyStyles: { fontStyle: "bold", lineWidth: 0.1 },
      tableWidth: 190,
      margin: { left: 10 },
    });

    // --- Footer: Attendance Summary ---
    let footerY = doc.lastAutoTable.finalY + 2;

    doc.setFontSize(9);
    doc.rect(10, footerY, 190, 8); // Box

    // Adjust spacing for attendance summary to fit within the table
    const attX = 12; // Start closer to the left edge
    const gap = 45; // Reduce gap between items
    const textY = footerY + 5;

    doc.text(`P-PRESENT DAYS : ${data.presentDays}`, attX, textY);
    doc.text(`AB - ABSENT DAYS : ${inputs.absentDays}`, attX + gap, textY);
    doc.text(`ND - NO DUTY DAYS : ${inputs.noDutyDays}`, attX + gap * 2, textY);
    doc.text(
      `SL - SICK LEAVE DAYS : ${inputs.sickLeaveDays}`,
      attX + gap * 3,
      textY,
    );

    // Signatures
    footerY += 20;
    doc.text("Prepared By Signatory.....................", 15, footerY);
    doc.text("Received By Signatory.....................", 130, footerY);

    doc.save(`SalarySlip_${data.employeeName}_${monthName}.pdf`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  if (!data)
    return (
      <div className="h-screen flex items-center justify-center">
        Error Loading Data
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex justify-center">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-none border border-slate-300 print:shadow-none">
        {/* TOP BAR ACTIONS */}
        <div className="bg-slate-800 text-white p-4 flex justify-end items-center no-print">
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}{" "}
              Save Slip
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-sm transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>

        {/* --- HTML PREVIEW --- */}
        <div className="p-8 font-serif text-slate-900">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              BABA CAR WASHING AND CLEANING LLC
            </h1>
          </div>

          {/* Info Row */}
          <div className="flex justify-between items-end border-b border-black pb-2 mb-2 text-sm font-bold">
            <div>
              Employee Name :{" "}
              <span className="uppercase">{data.employeeName}</span>
            </div>
            <div>Employee Code : {data.employeeCode}</div>
            <div className="uppercase">
              {new Date(year, month).toLocaleString("default", {
                month: "short",
              })}
              /{String(year).slice(-2)} Salary
            </div>
          </div>

          {/* MAIN TABLE */}
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 w-[15%]">Date</th>
                <th className="border border-black p-2 w-[55%] text-left">
                  Particulars
                </th>
                <th className="border border-black p-2 w-[15%] text-right">
                  Debit
                </th>
                <th className="border border-black p-2 w-[15%] text-right">
                  Credit
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 font-bold">
                  {new Date(year, month).toLocaleString("default", {
                    month: "short",
                  })}
                  /{String(year).slice(-2)} BASIC SALARY
                </td>
                <td className="border border-black p-2 text-right">
                  {data.basicSalary}
                </td>
                <td className="border border-black p-2 text-right"></td>
              </tr>
              <tr>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2">EXTRA WORK AND OT</td>
                <td className="border border-black p-2 text-right">
                  {data.extraWorkOt}
                </td>
                <td className="border border-black p-2 text-right"></td>
              </tr>
              <tr>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2">EXTRA PAYMENT</td>
                <td className="border border-black p-2 text-right">
                  {data.extraPaymentIncentive}
                </td>
                <td className="border border-black p-2 text-right"></td>
              </tr>
              <tr>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 flex justify-between items-center">
                  ETISALAT SIM BALANCE
                  <input
                    type="number"
                    name="etisalatBalance"
                    value={inputs.etisalatBalance}
                    onChange={handleInputChange}
                    className="w-20 p-1 text-right border border-gray-300 rounded text-xs bg-yellow-50 focus:bg-white outline-none no-print"
                  />
                </td>
                <td className="border border-black p-2 text-right"></td>
                <td className="border border-black p-2 text-right font-bold text-blue-700">
                  {Number(inputs.etisalatBalance).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 flex justify-between items-center">
                  LAST MONTH BALANCE
                  <input
                    type="number"
                    name="lastMonthBalance"
                    value={inputs.lastMonthBalance}
                    onChange={handleInputChange}
                    className="w-20 p-1 text-right border border-gray-300 rounded text-xs bg-yellow-50 focus:bg-white outline-none no-print"
                  />
                </td>
                <td className="border border-black p-2 text-right"></td>
                <td className="border border-black p-2 text-right text-blue-700">
                  {Number(inputs.lastMonthBalance).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-center font-bold">
                  ADVANCE
                </td>
                <td className="border border-black p-2 flex justify-end">
                  <input
                    type="number"
                    name="advance"
                    value={inputs.advance}
                    onChange={handleInputChange}
                    className="w-24 p-1 text-right border border-gray-300 rounded text-xs bg-yellow-50 focus:bg-white outline-none no-print"
                    placeholder="Enter Amount"
                  />
                </td>
                <td className="border border-black p-2 text-right"></td>
                <td className="border border-black p-2 text-right text-red-600 font-bold">
                  {Number(inputs.advance).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 flex justify-between items-center">
                  C3 PAY
                  <input
                    type="number"
                    name="c3Pay"
                    value={inputs.c3Pay}
                    onChange={handleInputChange}
                    className="w-24 p-1 text-right border border-gray-300 rounded text-xs bg-yellow-50 focus:bg-white outline-none no-print"
                  />
                </td>
                <td className="border border-black p-2 text-right"></td>
                <td className="border border-black p-2 text-right text-blue-700">
                  {Number(inputs.c3Pay).toFixed(2)}
                </td>
              </tr>
              <tr className="bg-gray-100 font-bold">
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 text-right">TOTAL</td>
                <td className="border border-black p-2 text-right">
                  {data.totalDebit}
                </td>
                <td className="border border-black p-2 text-right">
                  {totalCredit}
                </td>
              </tr>
              <tr className="bg-slate-200 font-black text-lg">
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 text-right">
                  CLOSING BALANCE
                </td>
                <td className="border border-black p-2 text-right" colSpan={2}>
                  {closingBalance}
                </td>
              </tr>
            </tbody>
          </table>

          {/* DAILY BREAKDOWN GRID */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse border border-black text-center text-xs">
              <thead>
                <tr className="bg-gray-200">
                  {Array.from({ length: 15 }, (_, i) => (
                    <th key={i} className="border border-black p-1">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {Array.from({ length: 15 }, (_, i) => (
                    <td key={i} className="border border-black p-1 font-bold">
                      {data.dailyData[i + 1] || 0}
                    </td>
                  ))}
                </tr>
              </tbody>
              <thead>
                <tr className="bg-gray-200">
                  {Array.from({ length: 16 }, (_, i) => (
                    <th key={i + 15} className="border border-black p-1">
                      {i + 16}
                    </th>
                  ))}
                  <th className="border border-black p-1 bg-slate-800 text-white">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {Array.from({ length: 16 }, (_, i) => (
                    <td
                      key={i + 15}
                      className="border border-black p-1 font-bold"
                    >
                      {data.dailyData[i + 16] || 0}
                    </td>
                  ))}
                  <td className="border border-black p-1 font-black text-lg">
                    {data.totalWashes}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ATTENDANCE SUMMARY */}
          <div className="flex flex-wrap justify-between items-center border border-black p-2 mt-4 text-xs font-bold bg-gray-50">
            <span>P - PRESENT DAYS: {data.presentDays}</span>
            <span className="flex items-center gap-1">
              AB - ABSENT DAYS:{" "}
              <input
                type="number"
                name="absentDays"
                value={inputs.absentDays}
                onChange={handleInputChange}
                className="w-10 border-b border-black text-center bg-transparent outline-none"
              />
            </span>
            <span className="flex items-center gap-1">
              ND - NO DUTY DAYS:{" "}
              <input
                type="number"
                name="noDutyDays"
                value={inputs.noDutyDays}
                onChange={handleInputChange}
                className="w-10 border-b border-black text-center bg-transparent outline-none"
              />
            </span>
            <span className="flex items-center gap-1">
              SL - SICK LEAVE DAYS:{" "}
              <input
                type="number"
                name="sickLeaveDays"
                value={inputs.sickLeaveDays}
                onChange={handleInputChange}
                className="w-10 border-b border-black text-center bg-transparent outline-none"
              />
            </span>
          </div>

          {/* SIGNATURES */}
          <div className="flex justify-between mt-12 px-8 font-bold text-sm">
            <div>Prepared By Signatory.....................</div>
            <div>Received By Signatory.....................</div>
          </div>
        </div>
      </div>
      <style>{`input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }`}</style>
    </div>
  );
};

export default SalarySlip;
