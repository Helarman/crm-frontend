import { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { ProductService } from '@/lib/api/product.service';
import { CategoryService } from '@/lib/api/category.service';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { AdditiveService } from '@/lib/api/additive.service';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProductFilters } from './ProductFilters';
import { ProductTable } from './ProductTable';
import { ProductModal } from './ProductModal';
import { ProductPreviewCard } from './ProductPreviewCard';

const ALL_CATEGORIES_VALUE = "all-categories";
const ALL_RESTAURANTS_VALUE = "all-restaurants";

export const ProductList = () => {
  const { language } = useLanguageStore();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [additives, setAdditives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    ingredients: '',
    images: [''],
    categoryId: '',
  });
  const [selectedAdditives, setSelectedAdditives] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES_VALUE);
  const [selectedRestaurant, setSelectedRestaurant] = useState(ALL_RESTAURANTS_VALUE);
  const [restaurants, setRestaurants] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchRestaurants();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsData, categoriesData, additivesData] = await Promise.all([
        ProductService.getAll(),
        CategoryService.getAll(),
        AdditiveService.getAll().catch(() => []),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setAdditives(additivesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const restaurantsData = await RestaurantService.getAll(); 
      setRestaurants(restaurantsData || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === ALL_CATEGORIES_VALUE || 
                          product.categoryId === selectedCategory;
    const matchesRestaurant = selectedRestaurant === ALL_RESTAURANTS_VALUE || 
                             (product.restaurants?.some((r: any) => r.id === selectedRestaurant));
    
    return matchesSearch && matchesCategory && matchesRestaurant;
  });

  const openAddModal = () => {
    setFormData({
      title: '',
      description: '',
      price: 0,
      ingredients: '',
      images: [''],
      categoryId: '',
    });
    setSelectedAdditives([]);
    setCurrentProductId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setCurrentProductId(product.id);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      ingredients: product.ingredients,
      images: product.images.length ? product.images : [''],
      categoryId: product.categoryId || '',
    });
    setSelectedAdditives(product.additives?.map((a: any) => a.id) || []);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await ProductService.delete(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleSubmitSuccess = () => {
    fetchData();
    setIsModalOpen(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {language === 'ru' ? 'Продукты' : 'პროდუქტები'}
        </h2>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          {language === 'ru' ? 'Добавить продукт' : 'პროდუქტის დამატება'}
        </Button>
      </div>

      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedRestaurant={selectedRestaurant}
        onRestaurantChange={setSelectedRestaurant}
        categories={categories}
        restaurants={restaurants}
        language={language}
      />

      <ProductTable
        products={filteredProducts}
        isLoading={isLoading}
        language={language}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onHover={setHoveredProduct}
      />

      {hoveredProduct && (
        <ProductPreviewCard 
          product={hoveredProduct}
          language={language}
        />
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleSubmitSuccess}
        productId={currentProductId}
        formData={formData}
        setFormData={setFormData}
        selectedAdditives={selectedAdditives}
        setSelectedAdditives={setSelectedAdditives}
        categories={categories}
        additives={additives}
        language={language}
      />
    </div>
  );
};