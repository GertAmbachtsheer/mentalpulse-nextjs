import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { supportApi } from "@/lib/convexCalls";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { FaRegHeart } from "react-icons/fa";
import { LuUsers } from "react-icons/lu";
import { RiSecurePaymentLine } from "react-icons/ri";

export default function SupportCard() {
  const { user } = useUser();
  const [support, setSupport] = useState<any>();
  const [ownAmount, setOwnAmount] = useState("");
  const getSupport = useQuery(supportApi.getSupport);
  const [selectedSupport, setSelectedSupport] = useState<any>(null);

  useEffect(() => {
    if (getSupport) {
      setSupport(getSupport);
    }
  }, [getSupport]);

  const handleSupport = (item: any) => {
    setSelectedSupport(selectedSupport?._id === item._id ? null : item);
    setOwnAmount(selectedSupport?._id === item._id ? "" : item.price.toString());
  };

  return (
    <section className="mx-2 mt-1 mb-1 bg-white rounded-xl p-6 shadow-sm border border-border/80">
      <h2 className="text-2xl font-semibold text-center mb-1">Support MentalPulse</h2>
      <p className="text-center text-sm text-muted-foreground">Help us keep this vital mental health resource free and accessible for all men</p>
      <div className="flex flex-col justify-around mt-6">
        <TabGroup className="w-full">
          <TabList className="flex justify-around rounded-md">
            <Tab className="w-full text-center rounded-md data-selected:text-gray-900 data-selected:font-bold text-md p-2 data-selected:shadow-sm cursor-pointer">Monthly Support</Tab>
            <Tab className="w-full text-center rounded-md data-selected:text-gray-900 data-selected:font-bold text-md p-2 data-selected:shadow-sm cursor-pointer">One-Time Gift</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <div className="flex flex-col gap-2 mt-4">
                {support?.filter((item: any) => item.type === "monthly")?.map((item: any) => (
                  <div key={item._id} className={`flex flex-col gap-2 border border-gray-400 rounded-xl p-2 shadow-sm hover:shadow-md transition-all cursor-pointer transition-200 ${selectedSupport?._id === item._id ? "border-2 border-lime-500" : ""}`} onClick={() => handleSupport(item)}>
                    <div className="flex justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex flex-col text-right">
                        <p className="text-xl font-semibold">R{item.price}</p>
                        <p className="text-sm text-muted-foreground">Per Month</p>
                      </div>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: item.benefits }} className="text-sm text-muted-foreground"/>
                  </div>
                ))}
              </div>
            </TabPanel>
            <TabPanel>
              <div className="flex flex-col gap-2">
                <div className="text-center my-3">
                  <h2 className="text-lg font-semibold">Make a One-Time Contribution</h2>
                  <p className="text-sm text-muted-foreground">Every contribution makes a difference in someone's mental health journey</p>
                </div>
                {support?.filter((item: any) => item.type === "once-off")?.map((item: any) => (
                  <div key={item._id} className={`flex flex-col border border-gray-300 rounded-xl p-2 shadow-sm hover:shadow-md transition-all cursor-pointer transition-200 text-left ${selectedSupport?._id === item._id ? "border-2 border-lime-500" : ""}`} onClick={() => handleSupport(item)}>
                    <p className="text-lg font-semibold">R{item.price}</p>
                    <h3 className="text-sm text-muted-foreground">{item.title}</h3>
                  </div>
                ))}
                <p className="text-center text-sm text-muted-foreground my-2">or</p>
                <div className="flex items-center border border-gray-300 rounded-xl p-2 shadow-sm hover:shadow-md transition-all cursor-pointer transition-200 text-left">
                  <label
                    htmlFor="amount"
                    className="text-sm font-semibold text-muted-foreground text-nowrap mr-2"
                  >
                    Custom Amount: R
                  </label>
                  <input
                    onChange={(e) => { setOwnAmount(e.target.value); setSelectedSupport(null); }}
                    id="amount"
                    name="amount"
                    type="text"
                    inputMode="numeric"
                    value={ownAmount}
                    onClick={() => setSelectedSupport(null)}
                    className="w-full px-1 py-1 bg-background/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-widest font-mono"
                    placeholder="Enter Amount"
                    required
                  />
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
        <div className="flex justify-center mt-6">
          <button className="w-full bg-lime-500 text-white font-semibold py-2 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer transition-200">Support</button>
        </div>
        <div className="flex flex-col justify-center mt-6 gap-1">
          <p className="flex items-center gap-1 text-sm text-muted-foreground"><RiSecurePaymentLine />Secure payments</p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground"><LuUsers />Community funded</p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground"><FaRegHeart />100% for mental health</p>
        </div>
      </div>
    </section>
  );
}