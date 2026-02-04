'use client'

import RedirectPage from "@/components/features/other/RedirectPage";

const ProductsPage = () => {
    return(
        <RedirectPage redirectSeconds={1} redirectTo="/reservation" />
    )
}

export default ProductsPage;