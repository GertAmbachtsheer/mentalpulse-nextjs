import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getSupport } from "@/lib/supabaseCalls";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { FaRegHeart } from "react-icons/fa";
import { LuUsers } from "react-icons/lu";
import { RiSecurePaymentLine } from "react-icons/ri";

export default function SupportCard() {
  const { user } = useUser();
  const [support, setSupport] = useState<any[]>([]);
  const [ownAmount, setOwnAmount] = useState("");
  const [selectedSupport, setSelectedSupport] = useState<any>(null);

  useEffect(() => {
    async function fetchSupport() {
      try {
        const data = await getSupport();
        setSupport(data || []);
      } catch (err) {
        console.error("Error fetching support:", err);
      }
    }
    fetchSupport();
  }, []);

  const handleSupport = (item: any) => {
    setSelectedSupport(selectedSupport?.id === item.id ? null : item);
    setOwnAmount(selectedSupport?.id === item.id ? "" : item.price.toString());
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-main dark:text-white">Support the Devs</h3>
        <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Thank you</span>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-soft">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">If this app helps you, consider buying us a coffee to keep the servers running!</p>
        
        <TabGroup className="w-full">
          <TabList className="flex justify-around rounded-xl bg-slate-50 dark:bg-slate-800 p-1 mb-4">
            <Tab className="w-full text-center rounded-lg data-[selected]:bg-white data-[selected]:text-primary data-[selected]:shadow-sm data-[selected]:font-bold text-sm text-slate-500 font-medium p-2 cursor-pointer transition-all focus:outline-none">Monthly</Tab>
            <Tab className="w-full text-center rounded-lg data-[selected]:bg-white data-[selected]:text-primary data-[selected]:shadow-sm data-[selected]:font-bold text-sm text-slate-500 font-medium p-2 cursor-pointer transition-all focus:outline-none">One-Time</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {support?.filter((item: any) => item.type === "monthly")?.map((item: any) => (
                  <button 
                    key={item.id} 
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition-all ${selectedSupport?.id === item.id ? "border-primary bg-primary/5" : "border-slate-100 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5"}`} 
                    onClick={() => handleSupport(item)}
                  >
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-[20px]">volunteer_activism</span>
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">R{item.price}</span>
                    <span className="text-[10px] text-slate-400 truncate w-full text-center">{item.title}</span>
                  </button>
                ))}
              </div>
            </TabPanel>
            
            <TabPanel>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {support?.filter((item: any) => item.type === "once-off")?.map((item: any) => (
                    <button 
                      key={item.id} 
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 transition-all ${selectedSupport?.id === item.id ? "border-primary bg-primary/5" : "border-slate-100 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5"}`} 
                      onClick={() => handleSupport(item)}
                    >
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">R{item.price}</span>
                      <span className="text-[10px] text-slate-400">{item.title}</span>
                    </button>
                  ))}
                </div>
                
                <div className="mt-2 text-center flex items-center gap-2">
                  <span className="h-px flex-1 bg-slate-100 dark:bg-slate-700"></span>
                  <span className="text-xs text-slate-400 font-medium">OR</span>
                  <span className="h-px flex-1 bg-slate-100 dark:bg-slate-700"></span>
                </div>
                
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all bg-slate-50 dark:bg-slate-800">
                  <span className="text-sm font-semibold text-slate-500 pl-3">R</span>
                  <input
                    onChange={(e) => { setOwnAmount(e.target.value); setSelectedSupport(null); }}
                    id="amount"
                    name="amount"
                    type="text"
                    inputMode="numeric"
                    value={ownAmount}
                    onClick={() => setSelectedSupport(null)}
                    className="w-full px-2 py-2 bg-transparent border-none focus:outline-none text-sm font-semibold text-slate-700 dark:text-slate-200"
                    placeholder="Custom Amount"
                  />
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
        
        <div className="mt-5">
          <button className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl shadow-md shadow-primary/30 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">favorite</span>
            Support Now
          </button>
        </div>
        
        <div className="flex items-center justify-center mt-5 gap-4">
          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Secure
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <span className="material-symbols-outlined text-[14px]">groups</span>
            Community
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <span className="material-symbols-outlined text-[14px]">favorite</span>
            100% Impact
          </div>
        </div>
      </div>
    </div>
  );
}