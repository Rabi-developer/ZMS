import CommissionInvoiceForm from '@/components/contractportion/commission/CommissionInvoicForm'
import MainLayout from '@/components/MainLayout/MainLayout'

const CommissionForm = () => {

    return (
        <MainLayout activeInterface="ZMS">
          <CommissionInvoiceForm/>
        </MainLayout>
    )
}

export default CommissionForm