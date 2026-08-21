import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import Welcome from "./pages/Welcome";
import { tools } from "./tools/registry";

export default function App() { return <Routes><Route element={<AppLayout/>}><Route index element={<Welcome/>}/>{tools.map(({ meta, Component }) => <Route key={meta.id} path={meta.path} element={<Component/>}/>)}<Route path="*" element={<Navigate to="/" replace/>}/></Route></Routes>; }
