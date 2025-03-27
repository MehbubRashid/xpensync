
import React, { useState } from 'react';
import { useEntry } from '@/context/EntryContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Filter, Clock } from 'lucide-react';
import { TimeGrouping, EntryType } from '@/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export const Filters: React.FC = () => {
  const { categories, filters, setFilters, timeGrouping, setTimeGrouping } = useEntry();
  const [expanded, setExpanded] = useState(false);

  const handleTypeChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      type: value as EntryType | 'all',
      // Reset category filter when changing type
      categoryId: null
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFilters(prev => ({ ...prev, categoryId: value === 'all' ? null : value }));
  };

  const handleTimeGroupingChange = (value: TimeGrouping) => {
    setTimeGrouping(value);
  };

  // Get filtered categories based on the selected type
  const filteredCategories = categories.filter(
    category => filters.type === 'all' || category.type === filters.type
  );

  return (
    <div className="w-full bg-muted/50 rounded-xl p-4 shadow-subtle animate-fade-in">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-medium">Filters & Grouping</h3>
          </div>
          <CollapsibleTrigger asChild>
            <button className="p-1 rounded-full hover:bg-muted transition-colors">
              <ChevronDown 
                size={16} 
                className={`text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} 
              />
            </button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-normal">Type</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Tabs 
                defaultValue={filters.type} 
                className="w-full"
                onValueChange={handleTypeChange}
                value={filters.type}
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="income" className="text-income-foreground">Income</TabsTrigger>
                  <TabsTrigger value="expense" className="text-expense-foreground">Expense</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {filters.type !== 'all' && (
                <Select 
                  onValueChange={handleCategoryChange} 
                  value={filters.categoryId || 'all'}
                  className="w-full max-w-[180px]"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-normal">
                <Clock size={12} className="mr-1" />
                Time Grouping
              </Badge>
            </div>
            <Tabs
              value={timeGrouping}
              onValueChange={value => handleTimeGroupingChange(value as TimeGrouping)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
