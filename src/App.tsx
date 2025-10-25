import { Route, Routes } from "react-router-dom";
import CanvasPlayground from "./pages/CanvasPlayground";
import Home from "./pages/Home";

const App = () => {
  return (
    <div className="bg-[#141414] w-screen h-screen overflow-hidden">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/playground" element={<CanvasPlayground />} />
      </Routes>
    </div>
  );
};

export default App;
