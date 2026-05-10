import * as XLSX from "xlsx";

export interface ParsedCandidate {
  name: string;
  email: string;
  phone?: string;
  source: string;
  status?: string;
  role?: string;
  interviewDate?: string;
  interviewTime?: string;
  joiningDate?: string;
}

export function parseExcelBuffer(buffer: ArrayBuffer): ParsedCandidate[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
  });

  if (jsonData.length === 0) return [];

  // Detect format by checking column headers
  const headers = Object.keys(jsonData[0]).map((h) => h.trim().toLowerCase());

  // Check if it's the custom tracker format (DATE, DAY, New joinees, Role, Contact...)
  const isTrackerFormat =
    headers.some((h) => h.includes("new joinees") || h.includes("joinees")) ||
    (headers.includes("date") && headers.includes("role") && headers.includes("contact"));

  if (isTrackerFormat) {
    return parseTrackerFormat(jsonData);
  }

  // Otherwise try standard Internshala export format
  return parseInternshalaFormat(jsonData);
}

// Parse the custom "Schedule of May" tracker format
// Columns: DATE | DAY | New joinees | Role | Contact | (gap) | Interview | Role | Time | Contact
function parseTrackerFormat(
  rows: Record<string, string>[]
): ParsedCandidate[] {
  const candidates: ParsedCandidate[] = [];

  for (const row of rows) {
    const keys = Object.keys(row);

    // Find "New joinees" column and associated Role/Contact
    const joineeKey = keys.find((k) =>
      k.toLowerCase().includes("new joinees") || k.toLowerCase().includes("joinees")
    );
    const date = row["DATE"] || row["Date"] || row["date"] || "";

    // Parse new joinees section
    if (joineeKey && row[joineeKey]?.trim()) {
      const name = row[joineeKey].trim();
      // Find the Role and Contact columns near the joinee column
      const joineeIdx = keys.indexOf(joineeKey);
      const roleKey = keys.find(
        (k, i) => i > joineeIdx && i <= joineeIdx + 2 && k.toLowerCase().includes("role")
      );
      const contactKey = keys.find(
        (k, i) => i > joineeIdx && i <= joineeIdx + 3 && k.toLowerCase().includes("contact")
      );

      const role = roleKey ? row[roleKey]?.trim() : "";
      const contact = contactKey ? row[contactKey]?.trim() : "";

      if (name && name !== "New joinees") {
        candidates.push({
          name,
          email: "",
          phone: contact || undefined,
          source: "Internshala",
          status: "HIRED",
          role: role || undefined,
          joiningDate: date || undefined,
        });
      }
    }

    // Parse interview section
    const interviewKey = keys.find(
      (k) => k.toLowerCase() === "interview" || k.toLowerCase().includes("interview")
    );

    if (interviewKey && row[interviewKey]?.trim()) {
      const interviewName = row[interviewKey].trim();
      // Find the Role, Time, Contact columns for interview section
      const intIdx = keys.indexOf(interviewKey);
      const intRoleKey = keys.find(
        (k, i) => i > intIdx && i <= intIdx + 2 && k.toLowerCase().includes("role")
      );
      const timeKey = keys.find(
        (k, i) => i > intIdx && i <= intIdx + 3 && k.toLowerCase().includes("time")
      );
      const intContactKey = keys.find(
        (k, i) => i > intIdx && i <= intIdx + 4 && k.toLowerCase().includes("contact")
      );

      const role = intRoleKey ? row[intRoleKey]?.trim() : "";
      const time = timeKey ? row[timeKey]?.trim() : "";
      const contact = intContactKey ? row[intContactKey]?.trim() : "";

      if (interviewName && interviewName !== "Interview") {
        // Avoid duplicates - check if already added as joinee
        const exists = candidates.find(
          (c) => c.name.toLowerCase() === interviewName.toLowerCase()
        );
        if (!exists) {
          candidates.push({
            name: interviewName,
            email: "",
            phone: contact || undefined,
            source: "Internshala",
            status: "INTERVIEW",
            role: role || undefined,
            interviewDate: date || undefined,
            interviewTime: time || undefined,
          });
        }
      }
    }
  }

  return candidates.filter((c) => c.name && c.name.length > 1);
}

// Parse standard Internshala export format
// Typical columns: Student name, Email, Phone, Applied On, Status, etc.
function parseInternshalaFormat(
  rows: Record<string, string>[]
): ParsedCandidate[] {
  return rows
    .map((row) => {
      const name =
        row["Student name"] ||
        row["Name"] ||
        row["name"] ||
        row["Applicant Name"] ||
        row["student_name"] ||
        row["Candidate Name"] ||
        row["Student Name"] ||
        "";

      const email =
        row["Email"] ||
        row["email"] ||
        row["Email ID"] ||
        row["email_id"] ||
        row["Email Address"] ||
        "";

      const phone =
        row["Phone"] ||
        row["phone"] ||
        row["Mobile"] ||
        row["mobile"] ||
        row["Phone Number"] ||
        row["Contact"] ||
        row["contact"] ||
        "";

      return {
        name: String(name).trim(),
        email: String(email).trim(),
        phone: phone ? String(phone).trim() : undefined,
        source: "Internshala",
      };
    })
    .filter((c) => c.name && c.name.length > 1);
}
