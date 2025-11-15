import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toPng } from "html-to-image";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaDownload, FaWhatsapp, FaPrint } from "react-icons/fa";
import Logo from "../images/church logo2.png";

const IDCard = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef();

  // Handle printing with QR codes
  const handlePrint = async () => {
    if (!participants.length) return alert("No participant data");
    
    const participant = participants[0];
    const studentId = participant.familyId || participant.id;
    
    try {
      let printWindow = window.open("", "_blank");
      
      const capitalizeName = (name) => {
        if (!name) return "";
        return name
          .split(" ")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      };
      
      let htmlContent = `
        <html>
          <head>
            <title>Print ID Card</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                padding: 20px;
                font-family: 'Poppins', Arial, sans-serif;
                background: white;
                margin: 0;
              }
              .card {
                width: 280px;
                height: 397px;
                padding: 15px;
                border: 2px solid #6c3483;
                border-radius: 12px;
                text-align: center;
                background: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                page-break-inside: avoid;
              }
              .header { margin-bottom: 10px; }
              .logo { width: 45px; height: 45px; object-fit: contain; margin-bottom: 6px; }
              .event-title { margin: 6px 0; font-size: 15px; font-weight: bold; color: #6c3483; }
              .event-subtitle { margin: 2px 0; font-size: 10px; color: #333; }
              .event-date { margin: 1px 0; font-size: 8px; color: #555; }
              .divider { border: none; border-top: 1px solid #ccc; margin: 8px 0; }
              .name { margin: 8px 0; color: #6c3483; font-size: 15px; font-weight: bold; }
              .category-medical { margin: 4px 0; font-size: 9px; color: #333; }
              .qr-wrapper { margin: 10px 0; display: flex; justify-content: center; align-items: center; }
              .qr-wrapper img { width: 100px; height: 100px; border: 1px solid #ddd; }
              .student-id { margin: 6px 0; font-weight: bold; font-size: 12px; color: #6c3483; }
              @media print {
                body { background: white; padding: 0; }
                .card { margin: 0; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAABICAIAAACx0vT3AAAACXBIWXMAACHWAAAh1gGQfXrCAAACTUlEQVR4nO3WvWsUQBDG9/b2PJ/FyiIKgkQFETsL/wJBsVEJNhY2gk0gYoOFnaWFlY2NhZWFjZ2FhZWF4V9gYWMhahEVL8QLt5P7c7c7uzs3c3fJwAw35wPMcD8ze3u7u7PZbJZlWZIkwzBM0+zr6+toNJpMJkmSrFaryWSyWq3K5XJfX5/rupZl1Wq1+XzuOE65XE7TNEmSSqXyL/3+/h4aGorH41dXV/f39xxHSZJM03RddxwHACzL0jQtmUwyDKNSqXiex+M4AOj1eiSK4nK5bBxHkiTLsnQ6nXPOdV0ej4Ni/Pj4qNPpJJPJ7u5uQ1Ey4/E4FAqZplkqlXjcDgr6+/vT6/XW63UoFAqHwwzBsO6BfD7P8zzHcZIkAcDD4+M/JjbqVjD3+z3HcWxshMNhZrMZ+8t1XZqmNZtN13UZhuG6bnH+/f01DIMkScUx6B9XVx9lw+Ewz/MKhYJhGARBAPD29na/3z8/P/N9n+M40nQ4HFK73f7T0+FwSNP0brcDABH6nU6nz8/PV1dXhUIhGAwqM+jhcHh6enoymXQ6nXA4/PH+3t/fH9fdRqNBZbPZer1+fn5+eHhIZbNZl8uFRCJRr9eVGVSVTkWpVHrfBWtraxwOB6NREQT+lxjcbjeFQsGWZRGLhVu/X1FU55xjsZja3+YsNxuNRtJsVzSXlZXl5ubGYrHgcrlsbGyUy2WLxaLH4/n7tFqtVqvV/X6/2+3+4fH+RkkEQaDRaOT7/lxeWDKZ5HkehnHlZXm9XpvNhkQiMe+8IjY3N5nNZgSBYWZmhuM4DMPicrlISEgICAEhIAQkIQSEgBAQAkJACAgBISAEhIAQEAL+BgNBPXKkMBxkAAAAAElFTkSuQmCC" alt="Logo" class="logo">
                <h1 class="event-title">Deo Gratias 2025</h1>
                <p class="event-subtitle">Teens & Kids Retreat</p>
                <p class="event-date">(Dec 28 – 30) | St. Mary's Church, Dubai</p>
                <p class="event-date">P.O. BOX: 51200, Dubai, U.A.E</p>
                <hr class="divider">
              </div>
              <h2 class="name">${capitalizeName(participant.participantName)}</h2>
              <p class="category-medical">Category: ${participant.category || "-"} | Medical: ${participant.medicalConditions?.length ? participant.medicalConditions.join(", ") : "N/A"}</p>
              <div class="qr-wrapper">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(studentId)}" alt="QR Code" onerror="console.error('QR Code failed to load');">
              </div>
              <p class="student-id">${studentId}</p>
            </div>
          </body>
          <script>
            window.onload = function() {
              window.setTimeout(function() {
                window.print();
              }, 1000);
            };
          </script>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err) {
      console.error("Error printing:", err);
      alert("Error generating print: " + err.message);
    }
  };


  // Helper: calculate age from DOB
  const calculateAge = React.useCallback((dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }, []);

  // Helper: get category code based on age or dob
  const getCategoryCode = React.useCallback((age, dob) => {
    if (!age && dob) age = calculateAge(dob);
    if (age >= 8 && age <= 12) return "DGK";
    if (age >= 13 && age <= 18) return "DGT";
    return "N/A";
  }, [calculateAge]);

  // Utility: capitalize names
  const capitalizeName = (name) =>
    name
      ? name
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
      : "";

  // Map participants & ensure category code
  useEffect(() => {
    if (!state?.formData) return navigate("/register");

    const allParticipants = [state.formData, ...(state.siblings || [])].map((p) => ({
      ...p,
      familyId: p.familyId || `STU-${Math.floor(10000 + Math.random() * 90000)}`,
      category: p.category || getCategoryCode(p.age, p.dob),
    }));

    setParticipants(allParticipants);
  }, [state, navigate, getCategoryCode]);


  // Download ID card as PNG
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${capitalizeName(participants[0].participantName)}_ID.png`;
      link.click();

      // Update Firestore with generated ID info
      for (let p of participants) {
        if (p.docId) {
          const ref = doc(db, "users", p.docId);
          await updateDoc(ref, {
            idGenerated: true,
            generatedId: p.familyId,
            generatedAt: new Date(),
          });
        }
      }
    } catch (err) {
      console.error("Download error:", err);
    }
    setDownloading(false);
  };

  // Share IDs on WhatsApp
  const handleShareWhatsApp = () => {
    const ids = participants.map((p) => `${capitalizeName(p.participantName)}: ${p.familyId}`).join("\n");
    const message = `My registration IDs for Deo Gratias 2025 Teens & Kids Retreat:\n${ids}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  if (!participants.length) return null;
  const main = participants[0];
  const siblings = participants.slice(1);

  return (
    <div style={styles.page}>
      <div ref={cardRef} style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <img src={Logo} alt="Logo" style={styles.logo} />
          <div style={styles.headerText}>
            <h1 style={styles.title}>Deo Gratias 2025</h1>
            <p style={styles.subtitle}>Teens & Kids Retreat</p>
            <p style={styles.date}>(Dec 28 – 30) | St. Mary’s Church, Dubai</p>
            <p style={styles.date}>P.O. BOX: 51200, Dubai, U.A.E</p>
          </div>
        </div>

        <hr style={styles.divider} />

        {/* Main Participant */}
        <div style={styles.participant}>
          <h2 style={styles.name}>{capitalizeName(main.participantName)}</h2>
          <p style={styles.siblingDetail}>
            Category: {main.category} | Medical: {main.medicalConditions || "N/A"}
          </p>
          <div style={styles.qrWrapper}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(main.familyId)}`} alt="QR Code" style={{ width: 120, height: 120 }} />
          </div>
        </div>

        {/* Siblings */}
        {siblings.length > 0 && (
          <div style={styles.siblingsCard}>
            <h3 style={styles.siblingTitle}>Siblings Registered</h3>
            {siblings.map((sib, idx) => (
              <div key={idx} style={styles.siblingItem}>
                <p style={styles.siblingName}>
                  👧 {capitalizeName(sib.participantName)} ({sib.age || "N/A"} yrs)
                </p>
                <p style={styles.id}>
                  <strong>ID: {sib.familyId}</strong>
                </p>
                <p style={styles.siblingDetail}>
                  Category: {sib.category} | Medical: {sib.medicalConditions || "N/A"}
                </p>
                {sib.familyId && (
                  <div style={styles.qrWrapper}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(sib.familyId)}`} alt="QR Code" style={{ width: 120, height: 120 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Schedule / Notes */}
        <div style={styles.scheduleCard}>
        <p style={{ fontSize: "12px", color: "#bf524b" }}>
          <span style={{ fontWeight: "bold" }}>Note:</span> Registration is confirmed only after the payment of AED 100/- each for an applicant.
        </p>
        <h3 style={styles.scheduleTitle}>Lanyard Distribution at Church Premises</h3>
        <div style={styles.scheduleList}>
      
          <div style={{ marginBottom: "1em" }}>
            <span style={{ color: "#6c3483", fontWeight: "bold" }}>First Batch</span>
            <ul style={{ margin: "0.5em 0 0 1em" }}>
              <li>Saturday, November 22, 2025: 9:30am–1:30pm & 4:00pm–7:30pm</li>
              <li>Sunday, November 23, 2025: 9:30am–1:30pm</li>
            </ul>
          </div>
          <div style={{ marginBottom: "1em" }}>
            <span style={{ color: "#6c3483", fontWeight: "bold" }}>Second Batch</span>
            <ul style={{ margin: "0.5em 0 0 1em" }}>
              <li>Saturday, December 13, 2025: 9:30am–1:30pm & 4:00pm–7:30pm</li>
              <li>Sunday, December 14, 2025: 9:30am–1:30pm & 4:00pm–7:30pm</li>
            </ul>
          </div>
          <div style={{ marginBottom: "1em" }}>
            <span style={{ color: "#6c3483", fontWeight: "bold" }}>Final Batch</span>
            <ul style={{ margin: "0.5em 0 0 1em" }}>
              <li>Saturday, December 27, 2025: 9:30am–1:30pm & 4:00pm–7:30pm</li>
            </ul>
         
          </div>
        </div>
      </div>
      </div>

      {/* Buttons */}
      <div style={styles.buttons}>
        <button onClick={handlePrint} style={styles.print}>
          <FaPrint /> Print Card
        </button>
        <button onClick={handleDownload} style={styles.download}>
          <FaDownload /> {downloading ? "Downloading..." : "Download"}
        </button>
        <button onClick={handleShareWhatsApp} style={styles.share}>
          <FaWhatsapp /> Share on WhatsApp
        </button>
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
  page: {
    fontFamily: "'Poppins', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "#fff",
    minHeight: "80vh",
    padding: 20,
    gap: 20,
  },
  card: {
    width: 360,
    borderRadius: 25,
    background: "#fff",
    padding: 20,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },
  header: { display: "flex", alignItems: "center", gap: 15 },
  logo: { width: 60, height: 60, borderRadius: "50%", border: "2px solid #6c3483" },
  headerText: { display: "flex", flexDirection: "column" },
  title: { margin: 0, fontSize: 22, color: "#6c3483", fontWeight: 700 },
  subtitle: { margin: 0, fontSize: 14, color: "#555", fontWeight: "bold" },
  date: { margin: 0, fontSize: 12, color: "#333" },
  divider: { border: "1px solid #e0d4ff", margin: "10px 0" },
  participant: { textAlign: "center", padding: "10px 0" },
  name: { fontSize: 20, color: "#4b0082", margin: 0 },
  id: { fontSize: 13, margin: 3, color: "#6c3483", fontWeight: 600 },
  siblingDetail: { fontSize: 12, color: "#555", marginTop: 3 },
  siblingsCard: { background: "#fdf0ff", borderRadius: 15, padding: 10, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" },
  siblingTitle: { fontSize: 16, fontWeight: 700, color: "#6c3483", marginBottom: 8 },
  siblingItem: { background: "#fff", borderRadius: 8, padding: "8px 10px", marginBottom: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  siblingName: { fontWeight: 600, color: "#4b0082", fontSize: 14, margin: 0 },
  scheduleCard: { background: "#fdf0ff", borderRadius: 15, padding: 8, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" },
  scheduleTitle: { fontSize: 16, fontWeight: 700, color: "#6c3483", marginBottom: 8 },
  scheduleList: { fontSize: 12, lineHeight: 1.5, color: "#333" },
  qrWrapper: { marginTop: 10, display: "flex", justifyContent: "center" },
  buttons: { display: "flex", gap: 12, marginTop: 15, justifyContent: "center", flexWrap: "wrap" },
  print: {
    background: "#6c3483",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 600,
  },
  download: {
    background: "#6c3483",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 600,
  },
  share: {
    background: "#25d366",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 600,
  },
};

export default IDCard;