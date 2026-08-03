import { Link } from "react-router-dom";

function CategoryCard({ icon, name }) {
  return (
    <Link
      to={`/category/${encodeURIComponent(name)}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="category-card">
        <h2>{icon}</h2>
        <h3>{name}</h3>
      </div>
    </Link>
  );
}

export default CategoryCard;