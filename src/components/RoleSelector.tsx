
import { UserRole } from "@/types/auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RoleSelectorProps {
  value: UserRole;
  onChange: (value: UserRole) => void;
  className?: string;
}

const RoleSelector = ({ value, onChange, className }: RoleSelectorProps) => {
  const handleChange = (val: string) => {
    onChange(val as UserRole);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-medium">I am a...</h3>
      <RadioGroup
        value={value}
        onValueChange={handleChange}
        className="grid gap-4 md:grid-cols-3"
      >
        <div>
          <RadioGroupItem
            value="CLIENT"
            id="client"
            className="peer sr-only"
          />
          <Label
            htmlFor="client"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-gray-300 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <span className="mb-2 h-10 w-10 rounded-full bg-eventura-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-eventura-700">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </span>
            <span className="font-medium">Client</span>
            <span className="text-sm text-muted-foreground text-center">
              Looking to hire event services
            </span>
          </Label>
        </div>

        <div>
          <RadioGroupItem
            value="PROVIDER"
            id="provider"
            className="peer sr-only"
          />
          <Label
            htmlFor="provider"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-gray-300 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <span className="mb-2 h-10 w-10 rounded-full bg-eventura-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-eventura-700">
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </span>
            <span className="font-medium">Provider</span>
            <span className="text-sm text-muted-foreground text-center">
              Offering event services
            </span>
          </Label>
        </div>
        
        <div className="opacity-60 cursor-not-allowed">
          <RadioGroupItem
            value="ADMIN"
            id="admin"
            className="peer sr-only"
            disabled
          />
          <Label
            htmlFor="admin"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-gray-50 p-4"
          >
            <span className="mb-2 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 1.32 4.24 2.5 2.5 0 0 0 1.98 3A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.46 2.5 2.5 0 0 0 1.98-3 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5Z"></path>
                <path d="M12 12v.01"></path>
              </svg>
            </span>
            <span className="font-medium">Admin</span>
            <span className="text-sm text-muted-foreground text-center">
              Admin access only
            </span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default RoleSelector;
