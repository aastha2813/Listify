import CategoryCard from "../components/CategoryCard";
import categories from "../data/categories";

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📝 Listify</h1>
        <p>Your Shared To-Do List</p>
      </div>

      <div className="category-container">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            icon={category.icon}
            name={category.name}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;