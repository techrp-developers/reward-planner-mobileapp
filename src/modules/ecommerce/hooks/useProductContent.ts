import { useModuleContent, moduleContentQueryKey } from "../../common/cms/useModuleContent";

// Thin Product-specific wrapper kept for existing callers; new code should
// call useModuleContent('product') / useModuleContent(module) directly.
export const PRODUCT_CONTENT_QUERY_KEY = moduleContentQueryKey("product");

export const useProductContent = () => {
  const { moduleContent, ...query } = useModuleContent("product");

  return {
    ...query,
    productContent: moduleContent,
  };
};
