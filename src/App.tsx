import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import ProductEditor from '@/pages/ProductEditor';
import Categories from '@/pages/Categories';
import Universes from '@/pages/Universes';
import Banners from '@/pages/Banners';
import Orders from '@/pages/Orders';
import ManualOrderEditor from '@/pages/ManualOrderEditor';
import CheckoutLeads from '@/pages/CheckoutLeads';
import PriceCalculator from '@/pages/PriceCalculator';
import Users from '@/pages/Users';
import Collections from '@/pages/Collections';
import Discounts from '@/pages/Discounts';
import ShippingRates from '@/pages/ShippingRates';
import Accounting from '@/pages/Accounting';
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
          <Route path="products/new" element={<ProductEditor />} />
          <Route path="products/:id/edit" element={<ProductEditor />} />
          <Route path="universes" element={<Universes />} />
          <Route path="banners" element={<Banners />} />
          <Route path="categories" element={<Categories />} />
          <Route path="collections" element={<Collections />} />
          <Route path="discounts" element={<Discounts />} />
          <Route path="shipping" element={<ShippingRates />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/new" element={<ManualOrderEditor />} />
          <Route path="checkout-leads" element={<CheckoutLeads />} />
          <Route path="price-calculator" element={<PriceCalculator />} />
          <Route path="users" element={<Users />} />
          <Route path="accounting" element={<Accounting />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
