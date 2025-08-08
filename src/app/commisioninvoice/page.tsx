import CommissionFormList from '@/components/contractportion/commission/CommissionFormList'
import PaymentList from '@/components/contractportion/payment/PaymentList'
import MainLayout from '@/components/MainLayout/MainLayout'

const CommissionForm = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <CommissionFormList/>
        </MainLayout>
    )
}

export default CommissionForm