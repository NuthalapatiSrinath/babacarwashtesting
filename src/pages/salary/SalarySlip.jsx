import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Download, Loader2, Printer, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";
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

  // --- 4. Print Handler ---
  const handlePrint = () => {
    window.print();
  };

  // --- 5. Generate PDF ---
  const handleDownloadPDF = () => {
    if (!data) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [110, 220],
    });

    const monthName = new Date(year, month).toLocaleString("default", {
      month: "long",
    });
    const fullDate = `${monthName}/${String(year).slice(-2)}`;
    const pageWidth = 110;
    const margin = 3;
    const contentWidth = pageWidth - margin * 2;

    doc.setFont("helvetica");

    // Header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("BABA CAR WASHING AND CLEANING LLC", pageWidth / 2, margin + 5, {
      align: "center",
    });

    // Employee Info
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    let yPos = margin + 10;
    doc.text(
      `Employee Name : ${data.employeeName.toUpperCase()}`,
      margin + 1,
      yPos,
    );
    doc.text(
      `Employee Code : ${data.employeeCode || "N/A"}`,
      pageWidth - margin - 25,
      yPos,
    );
    doc.text(`${fullDate} Salary`, pageWidth - margin - 1, yPos, {
      align: "right",
    });

    // Table Header
    yPos += 4;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, contentWidth, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text("Date", margin + 8, yPos + 3.5, { align: "center" });
    doc.text("Particulars", margin + 35, yPos + 3.5, { align: "left" });
    doc.text("Debit", pageWidth - margin - 20, yPos + 3.5, { align: "center" });
    doc.text("Credit", pageWidth - margin - 5, yPos + 3.5, { align: "center" });

    // Lines
    doc.line(margin + 15, yPos, margin + 15, yPos + 65);
    doc.line(pageWidth - margin - 30, yPos, pageWidth - margin - 30, yPos + 65);
    doc.line(pageWidth - margin - 15, yPos, pageWidth - margin - 15, yPos + 65);

    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);

    const addRow = (dateText, particulars, debit, credit) => {
      doc.line(margin, yPos, pageWidth - margin, yPos);
      if (dateText) {
        doc.setFont("helvetica", "bold");
        doc.text(dateText, margin + 8, yPos + 3.5, { align: "center" });
        doc.setFont("helvetica", "normal");
      }
      doc.text(particulars, margin + 17, yPos + 3.5);
      if (debit) {
        doc.text("Dr", pageWidth - margin - 28, yPos + 3.5);
        doc.text(
          Number(debit).toFixed(2),
          pageWidth - margin - 31,
          yPos + 3.5,
          { align: "right" },
        );
      }
      if (credit) {
        doc.text("Cr", pageWidth - margin - 13, yPos + 3.5);
        doc.text(
          Number(credit).toFixed(2),
          pageWidth - margin - 16,
          yPos + 3.5,
          { align: "right" },
        );
      }
      yPos += 5;
    };

    addRow(
      "",
      `${fullDate.split("/")[0].substring(0, 3)}/${fullDate.split("/")[1]} BASIC SALARY`,
      data.basicSalary,
      null,
    );
    addRow("", "EXTRA WORK AND OT", data.extraWorkOt, null);
    addRow("", "EXTRA PAYMENT", data.extraPaymentIncentive, null);
    addRow("", "ETISALAT SIM BALANCE", null, inputs.etisalatBalance);
    addRow("", "LAST MONTH BALANCE", null, inputs.lastMonthBalance);
    addRow("ADVANCE", "", null, inputs.advance);
    addRow("", "C3 PAY", null, inputs.c3Pay);

    // TOTAL
    doc.setFont("helvetica", "bold");
    doc.line(margin, yPos, pageWidth - margin, yPos);
    doc.text("TOTAL", margin + 17, yPos + 3.5);
    doc.text(
      Number(data.totalDebit).toFixed(2),
      pageWidth - margin - 31,
      yPos + 3.5,
      { align: "right" },
    );
    doc.text(
      Number(totalCredit).toFixed(2),
      pageWidth - margin - 16,
      yPos + 3.5,
      { align: "right" },
    );
    yPos += 5;

    // CLOSING
    doc.line(margin, yPos, pageWidth - margin, yPos);
    doc.text("CLOSING BALANCE", margin + 17, yPos + 3.5);
    doc.text(
      Number(closingBalance).toFixed(2),
      pageWidth - margin - 16,
      yPos + 3.5,
      { align: "right" },
    );
    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // Warning
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    yPos += 3;
    doc.text(
      "You must keep an accurate record; if we discover that you are doing cars without recording them,",
      margin + 17,
      yPos,
    );
    doc.text(
      "you will be fined, and you won't receive any payments and other benefits from the company.",
      margin + 17,
      yPos + 2,
    );

    // Grid
    yPos += 8;
    const cellWidth = contentWidth / 16;
    const cellHeight = 4;

    // Row 1
    for (let i = 1; i <= 15; i++) {
      doc.rect(margin + (i - 1) * cellWidth, yPos, cellWidth, cellHeight);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5);
      doc.text(
        String(i),
        margin + (i - 1) * cellWidth + cellWidth / 2,
        yPos + 2.5,
        { align: "center" },
      );
    }
    yPos += cellHeight;
    for (let i = 1; i <= 15; i++) {
      doc.rect(margin + (i - 1) * cellWidth, yPos, cellWidth, cellHeight);
      doc.setFont("helvetica", "normal");
      doc.text(
        String(data.dailyData[i] || 0),
        margin + (i - 1) * cellWidth + cellWidth / 2,
        yPos + 2.5,
        { align: "center" },
      );
    }
    yPos += cellHeight + 2;

    // Row 2
    const secondRowDays = data.daysInMonth || 31;
    const offset = 15;
    for (let i = 16; i <= secondRowDays; i++) {
      doc.rect(margin + (i - 16) * cellWidth, yPos, cellWidth, cellHeight);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5);
      doc.text(
        String(i),
        margin + (i - 16) * cellWidth + cellWidth / 2,
        yPos + 2.5,
        { align: "center" },
      );
    }
    doc.setFillColor(0, 0, 0);
    doc.rect(
      margin + (secondRowDays - 15) * cellWidth,
      yPos,
      cellWidth,
      cellHeight,
      "F",
    );
    doc.setTextColor(255, 255, 255);
    doc.text(
      "TOTAL",
      margin + (secondRowDays - 15) * cellWidth + cellWidth / 2,
      yPos + 2.5,
      { align: "center" },
    );
    doc.setTextColor(0, 0, 0);

    yPos += cellHeight;
    for (let i = 16; i <= secondRowDays; i++) {
      doc.rect(margin + (i - 16) * cellWidth, yPos, cellWidth, cellHeight);
      doc.setFont("helvetica", "normal");
      doc.text(
        String(data.dailyData[i] || 0),
        margin + (i - 16) * cellWidth + cellWidth / 2,
        yPos + 2.5,
        { align: "center" },
      );
    }
    doc.rect(
      margin + (secondRowDays - 15) * cellWidth,
      yPos,
      cellWidth,
      cellHeight,
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text(
      String(data.totalWashes || 0),
      margin + (secondRowDays - 15) * cellWidth + cellWidth / 2,
      yPos + 2.5,
      { align: "center" },
    );

    // Footer
    yPos += cellHeight + 2;
    doc.rect(margin, yPos, contentWidth, 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.text(
      `P-PRESENT DAYS : ${data.presentDays}    AB - ABSENT DAYS : ${inputs.absentDays}    ND - NO DUTY DAYS : ${inputs.noDutyDays}    SL- SICK LEAVE DAYS : ${inputs.sickLeaveDays}`,
      margin + 1,
      yPos + 3.5,
    );

    yPos += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text("Prepared By Signatory.....................", margin + 1, yPos);
    doc.text(
      "Received By Signatory.....................",
      pageWidth - margin - 35,
      yPos,
    );

    doc.save(`SalarySlip_${data.employeeName}_${year}_${month}.pdf`);
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
    <div className="min-h-screen bg-slate-100 p-6 flex justify-center print:p-0 print:bg-white">
      {/* ID "printable-slip" IS CRITICAL FOR THE CSS BELOW
       */}
      <div
        id="printable-slip"
        className="bg-white shadow-xl print:shadow-none print:m-0"
        style={{ width: "110mm", minHeight: "220mm" }}
      >
        {/* Actions Bar (Hidden on Print) */}
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
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
              Save
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-sm transition-all"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-sm transition-all"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {/* --- EXACT UI LAYOUT (Visible in Print) --- */}
        <div
          className="p-1.5"
          style={{ fontFamily: "Arial, sans-serif", fontSize: "7px" }}
        >
          {/* Header */}
          <div className="text-center border-b-[1.5px] border-black pb-0.5 mb-0.5">
            <h1
              className="font-bold uppercase tracking-wide"
              style={{ fontSize: "9px" }}
            >
              BABA CAR WASHING AND CLEANING LLC
            </h1>
          </div>

          {/* Info */}
          <div
            className="grid grid-cols-3 border-b border-black pb-0.5 mb-0.5 font-bold"
            style={{ fontSize: "6.5px" }}
          >
            <div className="text-left">
              Employee Name : {data.employeeName.toUpperCase()}
            </div>
            <div className="text-center">
              Employee Code : {data.employeeCode || "N/A"}
            </div>
            <div className="text-right">
              {new Date(year, month).toLocaleString("default", {
                month: "short",
              })}
              /{String(year).slice(-2)} Salary
            </div>
          </div>

          {/* Main Table */}
          <table
            className="w-full border-collapse border border-black"
            style={{ fontSize: "6px" }}
          >
            <thead>
              <tr className="bg-gray-200">
                <th
                  className="border border-black px-1 py-0.5"
                  style={{ width: "12%" }}
                >
                  Date
                </th>
                <th
                  className="border border-black px-1 py-0.5 text-left"
                  style={{ width: "56%" }}
                >
                  Particulars
                </th>
                <th
                  className="border border-black px-1 py-0.5 text-center"
                  style={{ width: "16%" }}
                >
                  Debit
                </th>
                <th
                  className="border border-black px-1 py-0.5 text-center"
                  style={{ width: "16%" }}
                >
                  Credit
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-1 py-0.5"></td>
                <td className="border border-black px-1 py-0.5 uppercase">
                  {new Date(year, month).toLocaleString("default", {
                    month: "short",
                  })}
                  /{String(year).slice(-2)} BASIC {data.basicSalary} AED SALARY
                  INCLUDE ALL
                </td>
                <td className="border border-black px-1 py-0.5 text-right">
                  <span className="mr-2">Dr</span>
                  {data.basicSalary}
                </td>
                <td className="border border-black px-1 py-0.5"></td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5"></td>
                <td className="border border-black px-1 py-0.5 uppercase">
                  EXTRA WORK AND OT
                </td>
                <td className="border border-black px-1 py-0.5 text-right">
                  <span className="mr-2">Dr</span>
                  {data.extraWorkOt}
                </td>
                <td className="border border-black px-1 py-0.5"></td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5"></td>
                <td className="border border-black px-1 py-0.5 uppercase">
                  EXTRA PAYMENT
                </td>
                <td className="border border-black px-1 py-0.5 text-right">
                  <span className="mr-2">Dr</span>
                  {data.extraPaymentIncentive}
                </td>
                <td className="border border-black px-1 py-0.5"></td>
              </tr>

              <tr>
                <td className="border border-black px-1 py-0.5"></td>
                <td className="border border-black px-1 py-0.5 uppercase">
                  <div className="flex justify-between items-center">
                    <span>ETISALAT SIM BALANCE</span>
                    <input
                      type="number"
                      name="etisalatBalance"
                      value={inputs.etisalatBalance}
                      onChange={handleInputChange}
                      className="w-12 px-1 py-0.5 text-right border border-gray-400 rounded text-[6px] bg-yellow-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                      step="0.01"
                    />
                  </div>
                </td>
                <td className="border border-black px-1 py-0.5"></td>
                <td className="border border-black px-1 py-0.5 text-right">
                  <span className="mr-2">Cr</span>
                  {Number(inputs.etisalatBalance).toFixed(2)}
                </td>
              </tr>

              <tr>
                <td className="border border-black px-1 py-0.5"></td>
                <td className="border border-black px-1 py-0.5 uppercase">
                  <div className="flex justify-between items-center">
                    <span>LAST MONTH BALANCE</span>
                    <input
                      type="number"
                      name="lastMonthBalance"
                      value={inputs.lastMonthBalance}
                      onChange={handleInputChange}
                      className="w-12 px-1 py-0.5 text-right border border-gray-400 rounded text-[6px] bg-yellow-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                      step="0.01"
                    />
                  </div>
                </td>
                <td className="border border-black px-1 py-0.5"></td>
                <td className="border border-black px-1 py-0.5 text-right">
                  {Number(inputs.lastMonthBalance) > 0 && (
                    <span className="mr-2">Cr</span>
                  )}
                  {Number(inputs.lastMonthBalance).toFixed(2)}
                </td>
              </tr>

              <tr>
                <td className="border border-black px-1 py-0.5 text-center uppercase font-bold">
                  ADVANCE
                </td>
                <td className="border border-black px-1 py-0.5">
                  <div className="flex justify-end">
                    <input
                      type="number"
                      name="advance"
                      value={inputs.advance}
                      onChange={handleInputChange}
                      className="w-16 px-1 py-0.5 text-right border border-gray-400 rounded text-[6px] bg-yellow-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </td>
                <td className="border border-black px-1 py-0.5"></td>
                <td className="border border-black px-1 py-0.5 text-right">
                  {Number(inputs.advance) > 0 && (
                    <span className="mr-2">Cr</span>
                  )}
                  {Number(inputs.advance) > 0
                    ? Number(inputs.advance).toFixed(2)
                    : ""}
                </td>
              </tr>

              <tr>
                <td className="border border-black px-1 py-0.5"></td>
                <td className="border border-black px-1 py-0.5 uppercase">
                  <div className="flex justify-between items-center">
                    <span>C3 PAY</span>
                    <input
                      type="number"
                      name="c3Pay"
                      value={inputs.c3Pay}
                      onChange={handleInputChange}
                      className="w-16 px-1 py-0.5 text-right border border-gray-400 rounded text-[6px] bg-yellow-50 focus:bg-white outline-none print:border-none print:bg-transparent"
                      step="0.01"
                    />
                  </div>
                </td>
                <td className="border border-black px-1 py-0.5"></td>
                <td className="border border-black px-1 py-0.5 text-right">
                  {Number(inputs.c3Pay) > 0 && <span className="mr-2">Cr</span>}
                  {Number(inputs.c3Pay) > 0
                    ? Number(inputs.c3Pay).toFixed(2)
                    : ""}
                </td>
              </tr>

              <tr className="font-bold bg-gray-100">
                <td className="border border-black px-1 py-0.5"></td>
                <td className="border border-black px-1 py-0.5 text-right uppercase">
                  TOTAL
                </td>
                <td className="border border-black px-1 py-0.5 text-right">
                  {data.totalDebit}
                </td>
                <td className="border border-black px-1 py-0.5 text-right">
                  {totalCredit}
                </td>
              </tr>

              <tr className="font-bold">
                <td className="border border-black px-1 py-0.5"></td>
                <td className="border border-black px-1 py-0.5 text-right uppercase">
                  CLOSING BALANCE
                </td>
                <td className="border border-black px-1 py-0.5"></td>
                <td className="border border-black px-1 py-0.5 text-right">
                  {closingBalance}
                </td>
              </tr>
            </tbody>
          </table>

          <div
            className="border-x border-b border-black px-1 py-1"
            style={{ fontSize: "5.5px", lineHeight: "1.3" }}
          >
            You must keep an accurate record; if we discover that you are doing
            cars without recording them, you will be fined, and you won't
            receive any payments and other benefits from the company.
          </div>

          {/* Daily Breakdown */}
          <div className="mt-1">
            {/* Days 1-15 */}
            <table
              className="w-full border-collapse border border-black text-center"
              style={{ fontSize: "5.5px" }}
            >
              <tbody>
                <tr className="bg-gray-200 font-bold">
                  {Array.from({ length: 15 }, (_, i) => (
                    <td key={i} className="border border-black px-0.5 py-0.5">
                      {i + 1}
                    </td>
                  ))}
                </tr>
                <tr className="font-semibold">
                  {Array.from({ length: 15 }, (_, i) => (
                    <td key={i} className="border border-black px-0.5 py-0.5">
                      {data.dailyData[i + 1] || 0}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* Days 16-End + Total */}
            <table
              className="w-full border-collapse border border-black text-center mt-0.5"
              style={{ fontSize: "5.5px" }}
            >
              <tbody>
                <tr className="bg-gray-200 font-bold">
                  {Array.from(
                    { length: (data.daysInMonth || 31) - 15 },
                    (_, i) => (
                      <td
                        key={i + 15}
                        className="border border-black px-0.5 py-0.5"
                      >
                        {i + 16}
                      </td>
                    ),
                  )}
                  <td className="border border-black px-0.5 py-0.5 bg-black text-white font-bold">
                    TOTAL
                  </td>
                </tr>
                <tr className="font-semibold">
                  {Array.from(
                    { length: (data.daysInMonth || 31) - 15 },
                    (_, i) => (
                      <td
                        key={i + 15}
                        className="border border-black px-0.5 py-0.5"
                      >
                        {data.dailyData[i + 16] || 0}
                      </td>
                    ),
                  )}
                  <td
                    className="border border-black px-0.5 py-0.5 font-black"
                    style={{ fontSize: "7px" }}
                  >
                    {data.totalWashes}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Attendance */}
          <div
            className="border border-black mt-0.5 px-1 py-1 font-bold"
            style={{ fontSize: "6px" }}
          >
            <div className="grid grid-cols-4 gap-1">
              <div className="text-left">
                P-PRESENT DAYS: {data.presentDays}
              </div>
              <div className="text-left flex items-center gap-1">
                AB - ABSENT DAYS:{" "}
                <input
                  type="number"
                  name="absentDays"
                  value={inputs.absentDays}
                  onChange={handleInputChange}
                  className="w-6 border-b border-black text-center bg-transparent outline-none print:border-none"
                  style={{ fontSize: "6px" }}
                />
              </div>
              <div className="text-left flex items-center gap-1">
                ND - NO DUTY DAYS:{" "}
                <input
                  type="number"
                  name="noDutyDays"
                  value={inputs.noDutyDays}
                  onChange={handleInputChange}
                  className="w-6 border-b border-black text-center bg-transparent outline-none print:border-none"
                  style={{ fontSize: "6px" }}
                />
              </div>
              <div className="text-left flex items-center gap-1">
                SL- SICK LEAVE DAYS:{" "}
                <input
                  type="number"
                  name="sickLeaveDays"
                  value={inputs.sickLeaveDays}
                  onChange={handleInputChange}
                  className="w-6 border-b border-black text-center bg-transparent outline-none print:border-none"
                  style={{ fontSize: "6px" }}
                />
              </div>
            </div>
          </div>

          <div
            className="flex justify-between mt-2 px-1 font-bold"
            style={{ fontSize: "6px" }}
          >
            <div>Prepared By Signatory.......................</div>
            <div>Received By Signatory.......................</div>
          </div>
        </div>
      </div>

      {/* --- STRICT PRINT CSS --- */}
      <style>{`
        @media print {
          /* Force DL Size */
          @page {
            size: 110mm 220mm;
            margin: 0;
          }
          
          /* Reset Body */
          body {
            margin: 0;
            padding: 0;
            background: white !important;
            min-width: 110mm;
          }

          /* Hide Everything Else */
          body > * {
            visibility: hidden;
            display: none; /* Try removing from flow */
          }
          
          /* Show Only Our Container */
          #printable-slip, #printable-slip * {
            visibility: visible;
          }

          /* Position Container Exactly */
          #printable-slip {
            display: block !important;
            position: fixed;
            top: 0;
            left: 0;
            width: 110mm !important;
            height: 220mm !important;
            margin: 0 !important;
            padding: 2mm !important; /* Safety padding */
            box-shadow: none !important;
            overflow: hidden;
            background: white !important;
            z-index: 9999;
          }

          /* Utility Hides */
          .print\\:hidden {
            display: none !important;
          }

          /* Input Cleanup for Print */
          input[type=number] {
             -moz-appearance: textfield;
             border: none !important;
             background: transparent !important;
          }
          input::-webkit-outer-spin-button,
          input::-webkit-inner-spin-button {
             -webkit-appearance: none;
             margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SalarySlip;
