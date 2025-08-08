 import EndUseList from '@/components/item/enduse/EndUseList'
import FinalList from '@/components/item/final/FinalList'
 import MainLayout from '@/components/MainLayout/MainLayout'
 
 const EndUsePage = () => {
 
     return (
         <MainLayout activeInterface="ZMS">
             <EndUseList/>
         </MainLayout>
     )
 }
 
 export default EndUsePage 