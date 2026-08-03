import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Category from "./pages/Category";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/category/:name" element={<Category />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;