import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProviderProfileRequest, ServiceType } from "@/types/provider";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const providerProfileSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  serviceType: z.enum(["CATERING", "WEDDING_PLANNING", "VENUE", "PHOTOGRAPHY", "MUSIC", "DECORATION", "OTHER"] as const),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  mobileNumber: z.string().min(10, { message: "Please enter a valid phone number" }),
}).required();

type ProviderProfileFormData = ProviderProfileRequest;

interface ProviderProfileFormProps {
  initialData?: ProviderProfileRequest;
  onSubmit: (data: ProviderProfileRequest) => Promise<void>;
  submitLabel?: string;
}

const ProviderProfileForm = ({ initialData, onSubmit, submitLabel = "Save Profile" }: ProviderProfileFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProviderProfileFormData>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: initialData || {
      companyName: "",
      serviceType: "CATERING" as ServiceType,
      address: "",
      mobileNumber: "",
    },
  });

  const handleSubmit = async (data: ProviderProfileFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      toast({
        title: "Success",
        description: "Profile saved successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save profile";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CATERING">Catering</SelectItem>
                  <SelectItem value="WEDDING_PLANNING">Wedding Planning</SelectItem>
                  <SelectItem value="VENUE">Venue</SelectItem>
                  <SelectItem value="PHOTOGRAPHY">Photography</SelectItem>
                  <SelectItem value="MUSIC">Music</SelectItem>
                  <SelectItem value="DECORATION">Decoration</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter your business address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter your mobile number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
};

export default ProviderProfileForm; 