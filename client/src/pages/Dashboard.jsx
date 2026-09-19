import CategoryCard from "../components/CategoryCard";
import categories from "../data/categories";

function Dashboard() {
  return (
    <div className="dashboard">

      {/* Decorative background shapes */}
      <div className="dashboard-decoration decoration-left"></div>
      <div className="dashboard-decoration decoration-right"></div>

      {/* Centered Header */}
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="brand-icon">🏠</span>

          <div>
            <h1>Listify</h1>
            <p>Family To-Do Lists</p>
          </div>
        </div>
      </header>

      {/* Category Cards */}
      <main className="category-container">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            icon={category.icon}
            name={category.name}
          />
        ))}
      </main>

      {/* Family Footer */}
      <div className="dashboard-footer">
        <span className="footer-family-icon">👨‍👩‍👧‍👦</span>

        <span>
          Keeping track of what matters — for our home.
        </span>

        <span className="footer-heart">♡</span>
      </div>

    </div>
  );
}

export default Dashboard;