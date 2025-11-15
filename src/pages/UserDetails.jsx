import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import { db } from "../firebase";
import Logo from "../images/church logo2.png";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const cardRef = useRef();
  const buttonRef = useRef();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", id));
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() };
          setUser(userData);
          setEditData(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, [id]);

  if (!user) return <div style={styles.notFound}>User not found</div>;

  const getMedicalText = () => {
    if (!user.medicalConditions?.length) return "None";
    const conditions = user.medicalConditions.join(", ");
    return user.medicalNotes ? `${conditions} (${user.medicalNotes})` : conditions;
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    if (buttonRef.current) buttonRef.current.style.display = "none";
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, backgroundColor: "#fff" });
      const fileName = (user.participantName || user.name || "user")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${fileName}_ID.png`;
      link.click();

      const userDocRef = doc(db, "users", id);
      await updateDoc(userDocRef, { idGenerated: true, idGeneratedAt: new Date() });
    } catch (err) {
      console.error("Error generating ID image:", err);
    } finally {
      if (buttonRef.current) buttonRef.current.style.display = "inline-block";
    }
  };

  const handlePrint = () => {
    if (!user) return alert("No user data");
    
    const studentId = user.studentId || user.id;
    const printWindow = window.open("", "_blank");
    
    const capitalizeName = (name) => {
      if (!name) return "";
      return name
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    };
    
    const htmlContent = `
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
            <h2 class="name">${capitalizeName(user.participantName || "")}</h2>
            <p class="category-medical">Category: ${user.category || "-"} | Medical: ${user.medicalConditions?.length ? user.medicalConditions.join(", ") : "N/A"}</p>
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
  };

  const handleSaveEdit = async () => {
    try {
      await updateDoc(doc(db, "users", id), editData);
      setUser(editData);
      setIsEditing(false);
      alert("✅ User details updated successfully!");
    } catch (err) {
      console.error("Error updating user:", err);
      alert("❌ Error updating user: " + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditData(user);
    setIsEditing(false);
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>
        ← Back
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={styles.heading}>User Details</h2>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} style={{ ...styles.backButton, backgroundColor: "#3498db", color: "white" }}>
            ✏️ Edit
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleSaveEdit} style={{ ...styles.backButton, backgroundColor: "#27ae60", color: "white" }}>
              💾 Save
            </button>
            <button onClick={handleCancelEdit} style={{ ...styles.backButton, backgroundColor: "#e74c3c", color: "white" }}>
              ✕ Cancel
            </button>
          </div>
        )}
      </div>

      <div style={styles.contentWrapper}>
        {/* User Info Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.tableLabel}>Name</td>
                <td style={styles.tableValue}>{user.participantName || user.name}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>ID</td>
                <td style={styles.tableValue}>{user.studentId || user.id}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Date of Birth</td>
                <td style={styles.tableValue}>{user.dob || "-"}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Age</td>
                <td style={styles.tableValue}>{user.age || "-"}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Category</td>
                <td style={styles.tableValue}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.category || ""}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                      style={styles.editInput}
                    />
                  ) : (
                    user.category || "-"
                  )}
                </td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Primary Contact</td>
                <td style={styles.tableValue}>
                  {user.primaryContactNumber && user.primaryContactRelation
                    ? `${user.primaryContactNumber} (${user.primaryContactRelation})`
                    : "-"}
                </td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Secondary Contact</td>
                <td style={styles.tableValue}>
                  {user.secondaryContactNumber && user.secondaryContactRelationship
                    ? `${user.secondaryContactNumber} (${user.secondaryContactRelationship})`
                    : "-"}
                </td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Email</td>
                <td style={styles.tableValue}>{user.email}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Residence</td>
                <td style={styles.tableValue}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.residence || ""}
                      onChange={(e) => setEditData({ ...editData, residence: e.target.value })}
                      style={styles.editInput}
                    />
                  ) : (
                    user.residence || user.address || "-"
                  )}
                </td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Medical Conditions</td>
                <td style={styles.tableValue}>{getMedicalText()}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Medical Notes</td>
                <td style={styles.tableValue}>
                  {isEditing ? (
                    <textarea
                      value={editData.medicalNotes || ""}
                      onChange={(e) => setEditData({ ...editData, medicalNotes: e.target.value })}
                      style={{ ...styles.editInput, minHeight: 60, fontFamily: "monospace" }}
                    />
                  ) : (
                    user.medicalNotes || "-"
                  )}
                </td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Parent Signature</td>
                <td style={styles.tableValue}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.parentSignature || ""}
                      onChange={(e) => setEditData({ ...editData, parentSignature: e.target.value })}
                      style={styles.editInput}
                    />
                  ) : (
                    user.parentSignature || "-"
                  )}
                </td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Registration Fee</td>
                <td style={styles.tableValue}>AED {user.registrationFee || 100}/-</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Fee Status</td>
                <td style={styles.tableValue}>{user.feeStatus || "pending"}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Status</td>
                <td style={styles.tableValue}>{user.inSession ? "Online" : "Offline"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ID Card */}
        <div style={styles.cardWrapper}>
          <h3 style={styles.cardHeading}>User ID Card</h3>
          <div ref={cardRef} style={styles.card}>
            {/* Header */}
            <div style={styles.header}>
              <img src={Logo} alt="Logo" style={styles.logo} />
              <h1 style={styles.eventTitle}>Deo Gratias 2025</h1>
              <p style={styles.eventSubtitle}>Teens & Kids Retreat</p>
              <p style={styles.eventDate}>(Dec 28 – 30) | St. Mary's Church, Dubai</p>
              <p style={styles.eventLocation}>P.O. BOX: 51200, Dubai, U.A.E</p>
              <hr style={styles.divider} />
            </div>

            {/* Name */}
            <h2 style={styles.participantName}>
              {user.participantName || user.name}
            </h2>

            {/* Category & Medical Info */}
            <p style={styles.categoryMedical}>
              Category: {user.category || "-"} | Medical: {getMedicalText()}
            </p>

            {/* Barcode/ID */}
            <div style={styles.qrWrapper}>
              <QRCodeCanvas value={user.studentId || user.id} size={120} />
            </div>
            
            {/* Student ID */}
            <p style={styles.studentId}>
              {user.studentId || user.id}
            </p>
          </div>

          <div style={styles.buttonWrapper}>
            <button ref={buttonRef} onClick={handleDownload} style={styles.downloadBtn}>
              Download ID
            </button>
            <button onClick={handlePrint} style={styles.printBtn}>
              Print ID
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Responsive Styles ----------
const styles = {
  container: { padding: 20, fontFamily: "Arial, sans-serif" },
  notFound: { padding: 20 },
  backButton: {
    marginBottom: 20,
    padding: "8px 16px",
    border: "1px solid #6c3483",
    borderRadius: 6,
    background: "#f5f5f5",
    cursor: "pointer",
  },
  heading: { marginBottom: 20 },
  contentWrapper: {
    display: "flex",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "center",
  },
  tableContainer: {
    flex: "1 1 300px",
    maxWidth: 400,
    minWidth: 250,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  tableLabel: { border: "1px solid #ccc", padding: "8px 12px", fontWeight: "bold", background: "#f9f9f9", width: "35%" },
  tableValue: { border: "1px solid #ccc", padding: "8px 12px" },
  editInput: {
    width: "100%",
    padding: "6px 8px",
    borderRadius: 4,
    border: "1px solid #3498db",
    fontSize: 14,
    boxSizing: "border-box",
  },
  cardWrapper: { flex: "1 1 320px", maxWidth: 400, minWidth: 280, textAlign: "center" },
  cardHeading: { marginBottom: 15 },
  card: {
    width: "280px", // 7.4cm at 96 DPI (~280px)
    height: "397px", // 10.5cm at 96 DPI (~397px)
    padding: "12px",
    border: "2px solid #6c3483",
    borderRadius: 8,
    textAlign: "center",
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  logoSection: { marginBottom: 6 },
  logo: { maxWidth: 60, height: "auto", marginBottom: 4 },
  header: { textAlign: "center", marginBottom: 8 },
  eventTitle: { margin: "4px 0", fontSize: 14, fontWeight: "bold", color: "#6c3483" },
  eventSubtitle: { margin: "2px 0", fontSize: 10, color: "#333" },
  eventDate: { margin: "1px 0", fontSize: 8, color: "#555" },
  eventLocation: { margin: "1px 0", fontSize: 8, color: "#777" },
  divider: { margin: "4px 0", border: "none", borderTop: "1px solid #ccc" },
  participantName: { margin: "6px 0", color: "#6c3483", fontSize: 14, fontWeight: "bold" },
  categoryMedical: { margin: "4px 0", fontSize: 8, color: "#333" },
  studentId: { margin: "2px 0", fontWeight: "bold", fontSize: 12, color: "#6c3483" },
  organization: { margin: "2px 0", fontSize: 12, color: "#2c3e50", fontWeight: "bold" },
  subText: { margin: "1px 0", fontSize: 10, color: "#555" },
  subTextSmall: { margin: "1px 0", fontSize: 9, color: "#777" },
  name: { margin: "4px 0", color: "#6c3483", fontSize: 14, fontWeight: "bold" },
  idText: { margin: "2px 0", fontWeight: "bold", fontSize: 12 },
  qrWrapper: { marginTop: 6, display: "flex", justifyContent: "center" },
  addressText: { fontSize: 12, color: "#555", marginTop: 12 },
  buttonWrapper: { marginTop: 20, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" },
  downloadBtn: { padding: "10px 20px", background: "#6c3483", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
  printBtn: { padding: "10px 20px", background: "#117864", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
};

export default UserDetails;
