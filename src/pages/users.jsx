import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { toPng } from "html-to-image";
import { QRCodeCanvas } from "qrcode.react";
import Logo from "../images/church logo2.png";

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Capitalize first letter of each word
  const capitalizeName = (name) =>
    name
      ? name
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : "";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  const handleEdit = (id) => navigate(`/admin/users/${id}`);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSelectedUsers((prev) => prev.filter((uid) => uid !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const toggleSelectUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  // Regenerate unique student IDs for all users
  const handleRegenerateIDs = async () => {
    if (!window.confirm("This will regenerate IDs for all users. Continue?")) return;
    
    try {
      const categoryCounters = { DGK: 0, DGT: 0, UND: 0, OVR: 0 };
      
      // Sort users by creation date
      const sortedUsers = [...users].sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateA - dateB;
      });

      // Assign new IDs
      for (const user of sortedUsers) {
        let code = "DGK"; // default
        if (user.category === "Teen") code = "DGT";
        else if (user.category === "Under 8") code = "UND";
        else if (user.category === "Over 20") code = "OVR";
        
        categoryCounters[code]++;
        const newStudentId = `${code}-${String(categoryCounters[code]).padStart(3, "0")}`;
        
        // Update Firebase
        await updateDoc(doc(db, "users", user.id), { studentId: newStudentId });
      }

      // Refresh users list
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
      
      alert("✅ All IDs have been regenerated successfully!");
    } catch (err) {
      console.error("Error regenerating IDs:", err);
      alert("❌ Error regenerating IDs: " + err.message);
    }
  };

  const getMedicalText = (user) => {
    if (!user.medicalConditions?.length) return null;
    const conditions = user.medicalConditions.join(", ");
    return user.medicalNotes ? `${conditions} (${user.medicalNotes})` : conditions;
  };

  const filteredUsers = users.filter((user) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "online" && user.inSession) ||
      (filter === "offline" && !user.inSession);
    const matchesSearch =
      user.participantName?.toLowerCase().includes(search.toLowerCase()) ||
      user.studentId?.toString().includes(search);
    return matchesFilter && matchesSearch;
  });

  const handleBulkPrint = async () => {
    const selected = users.filter((u) => selectedUsers.includes(u.id));
    if (!selected.length) return alert("Please select at least one user");

    try {
      let printWindow = window.open("", "_blank");
      let htmlContent = `
        <html>
          <head>
            <title>Print ID Cards</title>
            <style>
              body {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 10px;
                padding: 20px;
                font-family: 'Poppins', Arial, sans-serif;
                background: white;
                margin: 0;
              }
              .card {
                width: 280px;
                height: 397px;
                padding: 12px;
                border: 2px solid #6c3483;
                border-radius: 8px;
                text-align: center;
                background: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-sizing: border-box;
                page-break-inside: avoid;
              }
              .header {
                margin-bottom: 8px;
              }
              .logo {
                width: 40px;
                height: 40px;
                object-fit: contain;
                margin-bottom: 4px;
              }
              .event-title {
                margin: 4px 0;
                font-size: 14px;
                font-weight: bold;
                color: #6c3483;
              }
              .event-subtitle {
                margin: 2px 0;
                font-size: 10px;
                color: #333;
              }
              .event-date {
                margin: 1px 0;
                font-size: 8px;
                color: #555;
              }
              .divider {
                margin: 4px 0;
                border: none;
                border-top: 1px solid #ccc;
              }
              .name {
                margin: 6px 0;
                color: #6c3483;
                font-size: 14px;
                font-weight: bold;
              }
              .category-medical {
                margin: 4px 0;
                font-size: 8px;
                color: #333;
              }
              .qr-wrapper {
                margin-top: 6px;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              .qr-wrapper img {
                width: 120px;
                height: 120px;
                border: 1px solid #ddd;
              }
              .student-id {
                margin: 2px 0;
                font-weight: bold;
                font-size: 12px;
                color: #6c3483;
              }
              @media print {
                body {
                  background: white;
                  gap: 0;
                }
                .card {
                  margin: 5px;
                }
              }
            </style>
          </head>
          <body>
      `;

      for (let user of selected) {
        const studentId = user.studentId || user.id;
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(studentId)}`;
        
        htmlContent += `
          <div class="card">
            <div class="header">
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAABICAIAAACx0vT3AAAACXBIWXMAACHWAAAh1gGQfXrCAAACTUlEQVR4nO3WvWsUQBDG9/b2PJ/FyiIKgkQFETsL/wJBsVEJNhY2gk0gYoOFnaWFlY2NhZWFjZ2FhZWF4V9gYWMhahEVL8QLt5P7c7c7uzs3c3fJwAw35wPMcD8ze3u7u7PZbJZlWZIkwzBM0+zr6+toNJpMJkmSrFaryWSyWq3K5XJfX5/rupZl1Wq1+XzuOE65XE7TNEmSSqXyL/3+/h4aGorH41dXV/f39xxHSZJM03RddxwHACzL0jQtmUwyDKNSqXiex+M4AOj1eiSK4nK5bBxHkiTLsnQ6nXPOdV0ej4Ni/Pj4qNPpJJPJ7u5uQ1Ey4/E4FAqZplkqlXjcDgr6+/vT6/XW63UoFAqHwwzBsO6BfD7P8zzHcZIkAcDD4+M/JjbqVjD3+z3HcWxshMNhZrMZ+8t1XZqmNZtN13UZhuG6bnH+/f01DIMkScUx6B9XVx9lw+Ewz/MKhYJhGARBAPD29na/3z8/P/N9n+M40nQ4HFK73f7T0+FwSNP0brcDABH6nU6nz8/PV1dXhUIhGAwqM+jhcHh6enoymXQ6nXA4/PH+3t/fH9fdRqNBZbPZer1+fn5+eHhIZbNZl8uFRCJRr9eVGVSVTkWpVHrfBWtraxwOB6NREQT+lxjcbjeFQsGWZRGLhVu/X1FU55xjsZja3+YsNxuNRtJsVzSXlZXl5ubGYrHgcrlsbGyUy2WLxaLH4/n7tFqtVqvV/X6/2+3+4fH+RkkEQaDRaOT7/lxeWDKZ5HkehnHlZXm9XpvNhkQiMe+8IjY3N5nNZgSBYWZmhuM4DMPicrlISEgICAEhIAQkIQSEgBAQAkJACAgBISAEhIAQEAL+BgNBPXKkMBxkAAAAAElFTkSuQmCC" alt="Logo" class="logo">
              <h1 class="event-title">Deo Gratias 2025</h1>
              <p class="event-subtitle">Teens & Kids Retreat</p>
              <p class="event-date">(Dec 28 – 30) | St. Mary's Church, Dubai</p>
              <p class="event-date">P.O. BOX: 51200, Dubai, U.A.E</p>
              <hr class="divider">
            </div>
            <h2 class="name">${capitalizeName(user.participantName)}</h2>
            <p class="category-medical">Category: ${user.category || "-"} | Medical: ${user.medicalConditions?.length ? user.medicalConditions.join(", ") : "N/A"}</p>
            <div class="qr-wrapper">
              <img src="${qrImageUrl}" alt="QR Code" onerror="this.src='about:blank';">
            </div>
            <p class="student-id">${studentId}</p>
          </div>
        `;
      }

      htmlContent += `
          </body>
          <script>
            window.setTimeout(function() {
              window.print();
            }, 500);
          </script>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err) {
      console.error("Error generating bulk print:", err);
      alert("Error generating print: " + err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👥 Registered Users</h2>

      <div style={styles.controls}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={styles.select}>
          <option value="all">All</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <input
          type="text"
          placeholder="🔍 Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {selectedUsers.length > 0 && (
        <button onClick={handleBulkPrint} style={styles.bulkButton}>
          🖨️ Print Selected ({selectedUsers.length})
        </button>
      )}

      <button onClick={handleRegenerateIDs} style={{ ...styles.bulkButton, backgroundColor: "#e74c3c" }}>
        🔄 Regenerate All IDs
      </button>

      <div style={styles.cardsWrapper}>
        {filteredUsers.length ? (
          filteredUsers.map((user, index) => {
            const medicalText = getMedicalText(user);
            const hasMedical = !!medicalText;

            return (
              <div key={user.id} style={styles.cardWrapper}>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => toggleSelectUser(user.id)}
                  style={styles.checkbox}
                />

                <div
                  style={{
                    ...styles.card,
                    opacity: hasMedical ? 0.95 : 1,
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  className="user-card"
                >
                  <div style={styles.headerRow}>
                    <span style={styles.index}>#{index + 1}</span>
                    <span
                      style={{
                        ...styles.status,
                        backgroundColor: user.inSession ? "#27ae60" : "#7f8c8d",
                      }}
                    >
                      {user.inSession ? "Online" : "Offline"}
                    </span>
                  </div>

                  <h3
                    style={{
                      ...styles.name,
                      fontStyle: hasMedical ? "italic" : "normal",
                      color: hasMedical ? "#c0392b" : "#2980b9",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                  >
                    {capitalizeName(user.participantName)}
                  </h3>

                  <p style={styles.detail}>
                    <b>ID:</b> {user.studentId || user.id}
                  </p>
                  <p style={styles.detail}>
                    <b>Email:</b> {user.email}
                  </p>
                  <p style={styles.detail}>
                    <b>Primary Contact:</b> {user.primaryContactNumber}
                  </p>

                  {hasMedical && <p style={styles.healthBadge}>⚠ {medicalText}</p>}

                  <div style={styles.actions}>
                    <FaEdit style={styles.editIcon} onClick={() => handleEdit(user.id)} />
                    <FaTrash style={styles.deleteIcon} onClick={() => handleDelete(user.id)} />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={styles.noUsers}>No users found.</div>
        )}
      </div>
    </div>
  );
};

// ---------- Styles ----------
const styles = {
  container: { padding: 20, fontFamily: "'Arial', sans-serif", background: "#f9f9f9" },
  title: { marginBottom: 20, fontSize: 24, fontWeight: 700, color: "#2c3e50" },
  controls: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  select: { padding: 8, fontSize: 14, borderRadius: 6, border: "1px solid #ccc" },
  searchInput: { padding: 8, fontSize: 14, borderRadius: 6, border: "1px solid #ccc", flex: 1, minWidth: 200 },
  bulkButton: { padding: "8px 16px", marginBottom: 20, backgroundColor: "#6c3483", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  cardsWrapper: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 },
  cardWrapper: { position: "relative", paddingLeft: 28 },
  checkbox: { position: "absolute", top: 16, left: 0, width: 18, height: 18, cursor: "pointer" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    border: "1px solid #eee",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    position: "relative",
  },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  index: { fontSize: 14, fontWeight: 600, color: "#7f8c8d" },
  status: { fontSize: 12, fontWeight: 600, color: "#fff", padding: "4px 10px", borderRadius: 20, textTransform: "uppercase" },
  name: { fontSize: 20, fontWeight: 700, margin: "8px 0" },
  detail: { fontSize: 14, margin: "4px 0", color: "#555" },
  healthBadge: { marginTop: 8, padding: "6px 10px", backgroundColor: "#e74c3c", color: "#fff", borderRadius: 6, fontSize: 14, fontWeight: 600 },
  actions: { display: "flex", gap: 12, marginTop: 12 },
  editIcon: { color: "#27ae60", cursor: "pointer", fontSize: 18 },
  deleteIcon: { color: "#c0392b", cursor: "pointer", fontSize: 18 },
  noUsers: { textAlign: "center", padding: 20, color: "#7f8c8d" },
};

export default Users;
