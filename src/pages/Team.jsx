import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // "all", "teens", "kids"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Categorize users by age
  const teensUsers = users.filter(user => user.age >= 13 && user.age <= 18);
  const kidsUsers = users.filter(user => user.age >= 8 && user.age <= 12);

  // Get users based on category filter
  const getFilteredUsers = () => {
    if (categoryFilter === "teens") return teensUsers;
    if (categoryFilter === "kids") return kidsUsers;
    return [...teensUsers, ...kidsUsers];
  };

  const filteredUsers = getFilteredUsers();

  // Apply search filter
  const searchFilteredUsers = filteredUsers.filter(user =>
    user.participantName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p style={{ padding: 20 }}>Loading users...</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Teens & Kids Groups</h1>

      {/* Search + Category Filter */}
      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.filterButtons}>
          {[
            { value: "all", label: "All Members", color: "#2196F3" },
            { value: "teens", label: "Teens (13-18)", color: "#FF9800" },
            { value: "kids", label: "Kids (8-12)", color: "#4CAF50" }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setCategoryFilter(filter.value)}
              style={{
                ...styles.filterButton,
                backgroundColor: categoryFilter === filter.value ? filter.color : "#ddd",
                color: categoryFilter === filter.value ? "#fff" : "#333"
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Display Statistics */}
      <div style={styles.statsContainer}>
        <div style={styles.statBox}>
          <h3>Teens (13-18)</h3>
          <p style={{ fontSize: "28px", fontWeight: "700", color: "#FF9800" }}>{teensUsers.length}</p>
        </div>
        <div style={styles.statBox}>
          <h3>Kids (8-12)</h3>
          <p style={{ fontSize: "28px", fontWeight: "700", color: "#4CAF50" }}>{kidsUsers.length}</p>
        </div>
        <div style={styles.statBox}>
          <h3>Total</h3>
          <p style={{ fontSize: "28px", fontWeight: "700", color: "#2196F3" }}>{teensUsers.length + kidsUsers.length}</p>
        </div>
      </div>

      {/* Users Grid */}
      <div style={styles.grid}>
        {searchFilteredUsers.length === 0 ? (
          <p style={{ color: "#888", textAlign: "center", gridColumn: "1/-1", padding: "50px" }}>
            No members found matching your search.
          </p>
        ) : (
          searchFilteredUsers.map(user => {
            const isTeens = user.age >= 13 && user.age <= 18;
            const categoryColor = isTeens ? "#FF9800" : "#4CAF50";
            const categoryLabel = isTeens ? "Teens" : "Kids";

            return (
              <div key={user.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.userName}>{user.participantName}</h3>
                    <p style={styles.userDetails}>Age: {user.age}</p>
                  </div>
                  <span
                    style={{
                      ...styles.categoryBadge,
                      backgroundColor: categoryColor
                    }}
                  >
                    {categoryLabel}
                  </span>
                </div>

                <div style={styles.userInfoBox}>
                  <p><strong>Category:</strong> {user.category}</p>
                  <p><strong>Email:</strong> {user.email || "N/A"}</p>
                  <p><strong>Contact:</strong> {user.primaryContactNumber || "N/A"}</p>
                  <p><strong>Residence:</strong> {user.residence || "N/A"}</p>
                  {user.medicalConditions && user.medicalConditions.length > 0 && (
                    <p><strong>Medical:</strong> {user.medicalConditions.join(", ")}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ---------- Styles ----------
const styles = {
  container: { fontFamily: "Arial, sans-serif", padding: "30px", background: "#f9f9f9", minHeight: "100vh" },
  title: { fontSize: "32px", fontWeight: "700", marginBottom: "25px", color: "#333", textAlign: "center" },
  controls: { display: "flex", flexWrap: "wrap", gap: "15px", marginBottom: "30px", justifyContent: "center", alignItems: "center" },
  searchInput: { padding: "12px 15px", borderRadius: "25px", border: "1px solid #ccc", flex: "1", minWidth: "250px", fontSize: "16px", outline: "none", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
  filterButtons: { display: "flex", gap: "10px", flexWrap: "wrap" },
  filterButton: { padding: "10px 18px", borderRadius: "20px", border: "none", cursor: "pointer", fontWeight: "600", transition: "0.3s" },
  statsContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "30px", maxWidth: "600px", margin: "0 auto 30px" },
  statBox: { backgroundColor: "#fff", padding: "20px", borderRadius: "12px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #eee" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" },
  card: { backgroundColor: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transition: "transform 0.2s, box-shadow 0.2s" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" },
  userName: { fontSize: "18px", fontWeight: "700", color: "#333", margin: 0 },
  userDetails: { fontSize: "14px", color: "#666", margin: "5px 0 0" },
  categoryBadge: { padding: "6px 12px", borderRadius: "20px", color: "#fff", fontWeight: "600", fontSize: "12px", whiteSpace: "nowrap" },
  userInfoBox: { fontSize: "13px", color: "#555", lineHeight: "1.6" }
};

export default Team;
