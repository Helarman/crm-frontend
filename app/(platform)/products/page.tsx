'use client'

import RedirectPage from "@/components/features/other/RedirectPage";

const ProductsPage = () => {
    return(
        <RedirectPage redirectSeconds={1} redirectTo="/menu?tab=menu" />
    )
}

export default ProductsPage;