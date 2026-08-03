function CategoryCard({ icon, name }) {
  return (
    <div className="category-card">
      <h2>{icon}</h2>
      <h3>{name}</h3>
    </div>
  );
}

export default CategoryCard;