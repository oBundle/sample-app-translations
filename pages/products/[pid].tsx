import { useRouter } from "next/router";
import { useState } from "react";
import ErrorMessage from "@components/error";
import ProductForm from "@components/form";
import Loading from "@components/loading";
import { alertsManager } from "@pages/_app";
import { useProductInfo, useProductList } from "@lib/hooks";
import { FormData } from "@types";
import { useSession } from "context/session";

const ProductInfo = () => {
  const router = useRouter();
  const pid = Number(router.query?.pid);
  const { list = [], mutateList }  = useProductList();
  const { isLoading: isProductInfoLoading, error: hasProductInfoLoadingError, mutateInfo, product } = useProductInfo(pid, list);
  const { description, is_visible: isVisible, name, metafields } = product ?? {};
  const formData = { description, isVisible, name, metafields };
  const [ isProductSaving, setProductSaving ] = useState(false);
  const { context } = useSession();

  const handleCancel = () => router.push("/");

  const handleSubmit = (data: FormData, selectedLocale: string, useConciseStorage: boolean) => {
    try {
      data.locale = selectedLocale;
      data.useConciseMetafieldStorage = useConciseStorage;

      // Update product details
      setProductSaving(true);

      fetch(`/api/products/${pid}?context=${context}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      .then((res) => {
        setProductSaving(false);

        if (res.status === 200) {
          alertsManager.add({
            autoDismiss: true,
            messages: [
              {
                text: 'Product translations have been saved.',
              },
            ],
            type: 'success',
          });
          mutateList('/api/products/list');
          mutateInfo(`/api/products/${pid}`);
        } else if (res.status === 403) {
          alertsManager.add({
            autoDismiss: true,
            messages: [
              {
                text: 'Error updating product translations: Metafield limit exceeded',
              },
            ],
            type: 'error',
          });
        } else {
          alertsManager.add({
            autoDismiss: true,
            messages: [
              {
                text: 'Error updating product translations',
              },
            ],
            type: 'error',
          });
        }
      });
    } catch (error) {
      //display error
      console.error("Error updating product translations: ", error);
      alertsManager.add({
        autoDismiss: true,
        messages: [
          {
            text: `Error updating product translations: ${error}`,
          },
        ],
        type: 'error',
      })
      setProductSaving(false);
    }
  };

  const handleDelete = async (metafields: Array<any>) => {
    try {
      const options = {
        method: 'DELETE',
      };
      
      console.log('metafields to delete: ', metafields);
      
      for(let i = 0; i < metafields.length; i++) {
        const metafieldId = metafields[i].id;
        const response = await fetch(`/api/products/${pid}/metafields/${metafieldId}?context=${context}`, options);
      }
    
    } catch (error) {
      //display error
      console.error("Error deleting the metafields: ", error);
    }
  }

  if (hasProductInfoLoadingError) return <ErrorMessage />;

  return (
    <Loading isLoading={isProductInfoLoading}>
      <ProductForm
        formData={formData}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        isSaving={isProductSaving}
      />
    </Loading>
  );
};

export default ProductInfo;
