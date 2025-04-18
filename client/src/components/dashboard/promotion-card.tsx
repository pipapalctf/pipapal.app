import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PromotionCard() {
  return (
    <Card className="bg-gradient-to-br from-accent/90 to-accent overflow-hidden">
      <div className="p-5 text-white">
        <h3 className="text-xl font-bold font-montserrat mb-2">Free Compostable Bags</h3>
        <p className="mb-4 opacity-90">
          Invite friends to join PipaPal and get a pack of 10 compostable bags for free!
        </p>
        <Button className="bg-white text-accent hover:bg-white/90 border-0">
          <i className="fas fa-user-plus mr-2"></i>
          Invite Friends
        </Button>
      </div>
      <div className="flex justify-end">
        <img 
          src="https://cdn.pixabay.com/photo/2019/06/25/13/59/bags-4298363_1280.png" 
          alt="Compostable Bags" 
          className="h-24 -mb-2 -mr-2 object-contain"
        />
      </div>
    </Card>
  );
}
