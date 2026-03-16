import { useState, useMemo, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/guest/Header';
import { CategoryTabs } from '@/components/guest/CategoryTabs';
import { ActivityCard } from '@/components/guest/ActivityCard';
import { FeedbackSection } from '@/components/guest/FeedbackSection';
import { PricingToggle } from '@/components/guest/PricingToggle';
import { SearchBar } from '@/components/guest/SearchBar';
import { useCategories } from '@/hooks/useCategories';
import { useActivitiesWithPricingTiers } from '@/hooks/useActivities';

export default function GuestMenu() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isNonResident, setIsNonResident] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: activities = [], isLoading: activitiesLoading } = useActivitiesWithPricingTiers();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeCategory]);

  // Dynamic page title
  useEffect(() => {
    const cat = categories.find(c => c.id === activeCategory);
    document.title = cat
      ? `${cat.name} — Twin Rivers Resort Tigoni`
      : 'Twin Rivers Resort Tigoni — Activities & Price List';
  }, [activeCategory, categories]);

  const filteredActivities = useMemo(() => {
    let result = activities;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
      );
      // When searching, ignore category filter
      return result;
    }
    
    if (activeCategory) {
      result = result.filter(a => a.category_id === activeCategory);
    }
    return result;
  }, [activities, activeCategory, searchQuery]);

  const groupedActivities = useMemo(() => {
    if (searchQuery.trim()) {
      // Group search results by category
      const grouped: Record<string, typeof activities> = {};
      categories.forEach(cat => {
        const catActivities = filteredActivities.filter(a => a.category_id === cat.id);
        if (catActivities.length > 0) grouped[cat.id] = catActivities;
      });
      return grouped;
    }
    
    if (activeCategory) {
      return { [activeCategory]: filteredActivities };
    }
    
    const grouped: Record<string, typeof activities> = {};
    categories.forEach(cat => {
      const catActivities = activities.filter(a => a.category_id === cat.id);
      if (catActivities.length > 0) grouped[cat.id] = catActivities;
    });
    return grouped;
  }, [activities, categories, activeCategory, filteredActivities, searchQuery]);

  const isLoading = categoriesLoading || activitiesLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={(cat) => { setActiveCategory(cat); setSearchQuery(''); }}
          />
          
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          
          <PricingToggle 
            isNonResident={isNonResident} 
            onToggle={setIsNonResident} 
          />
          
          <main className="container py-6 space-y-8">
            {searchQuery.trim() && filteredActivities.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No activities match "{searchQuery}"</p>
              </div>
            )}
            
            {Object.entries(groupedActivities).map(([categoryId, categoryActivities]) => {
              const category = categories.find(c => c.id === categoryId);
              if (!category) return null;
              
              return (
                <section key={categoryId} id={categoryId}>
                  {(!activeCategory || searchQuery.trim()) && (
                    <h2 className="font-display text-xl font-bold text-primary mb-4 pb-2 border-b border-border">
                      {category.name}
                    </h2>
                  )}
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    {categoryActivities.map((activity, index) => (
                      <ActivityCard 
                        key={activity.id} 
                        activity={activity}
                        index={index}
                        isNonResident={isNonResident}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
            
            {activities.length === 0 && !searchQuery.trim() && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No activities available at the moment.</p>
              </div>
            )}
          </main>
          
          <FeedbackSection />
        </>
      )}
    </div>
  );
}
