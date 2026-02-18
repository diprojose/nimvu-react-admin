import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Categories from '@/pages/Categories';
import Orders from '@/pages/Orders';
import Users from '@/pages/Users';
import Collections from '@/pages/Collections';
import Discounts from '@/pages/Discounts';
import ShippingRates from '@/pages/ShippingRates';
import Login from '@/pages/Login';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="collections" element={<Collections />} />
          <Route path="discounts" element={<Discounts />} />
          <Route path="shipping" element={<ShippingRates />} />
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
