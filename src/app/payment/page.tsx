import PaymentList from '@/components/contractportion/payment/PaymentList'
import MainLayout from '@/components/MainLayout/MainLayout'

const PackingPage = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <PaymentList/>
        </MainLayout>
    )
}

export default PackingPage