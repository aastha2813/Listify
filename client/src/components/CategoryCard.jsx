import { Link } from "react-router-dom";

function CategoryCard({ icon, name }) {
  return (
    <Link
      to={`/category/${encodeURIComponent(name)}`}
      className="category-card-link"
    >
      <div className="category-card">

        {/* Decorative shapes */}
        <span className="card-decoration card-decoration-top"></span>
        <span className="card-decoration card-decoration-bottom"></span>

        {/* Category illustration */}
        <div className="category-icon">
          <img
            src={icon}
            alt={`${name} icon`}
            className="category-icon-image"
          />
        </div>

        {/* Category name */}
        <h3>{name}</h3>

        {/* Navigation arrow */}
        <div className="category-arrow">
          →
        </div>

      </div>
    </Link>
  );
}

export default CategoryCard;