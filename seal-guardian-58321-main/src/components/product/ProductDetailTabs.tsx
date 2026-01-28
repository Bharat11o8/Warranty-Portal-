import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductDetailTabsProps {
  description: string[];          // Expecting array of bullet points
  additionalInfo?: string[];      // Optional array of bullet points
}

// Helper function to render list items
const formatContent = (content: string[] | undefined) => {
  if (!content || content.length === 0) {
    return <li>No information available.</li>;
  }

  return content.map((item, index) => (
    <li key={index}>{item}</li>
  ));
};

const ProductDetailTabs: React.FC<ProductDetailTabsProps> = ({
  description,
  additionalInfo
}) => {
  return (
    <Tabs defaultValue="description" className="mt-12">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="additional">Additional Info</TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="mt-6 p-6 bg-white rounded-lg border">
        <ul className="list-disc list-inside space-y-2 prose max-w-none">
          {formatContent(description)}
        </ul>
      </TabsContent>

      <TabsContent value="additional" className="mt-6 p-6 bg-white rounded-lg border">
        <ul className="list-disc list-inside space-y-2 prose max-w-none">
          {formatContent(additionalInfo)}
        </ul>
      </TabsContent>
    </Tabs>
  );
};

export default ProductDetailTabs;
