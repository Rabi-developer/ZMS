import MainLayout from '@/components/MainLayout/MainLayout'
import PaymentTermList from '@/components/valuemanagement/paymentterm/PaymentTermList'

const PaymentTermPage = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <PaymentTermList/>
        </MainLayout>
    )
}

export default PaymentTermPage