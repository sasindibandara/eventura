import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ServiceRequestRequest, ServiceType } from "@/types/serviceRequest";
import { useToast } from "@/hooks/use-toast";

const serviceRequestSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  eventName: z.string().min(2, { message: "Event name must be at least 2 characters" }),
  eventDate: z.string().min(1, { message: "Event date is required" }),
  location: z.string().min(2, { message: "Location must be at least 2 characters" }),
  serviceType: z.enum(["CATERING", "WEDDING_PLANNING", "VENUE", "PHOTOGRAPHY", "MUSIC", "DECORATION", "OTHER"] as const),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  budget: z.number().min(0, { message: "Budget must be a positive number" }),
}).required();

type ServiceRequestFormData = ServiceRequestRequest;

interface ServiceRequestFormProps {
  onSubmit: (data: ServiceRequestRequest) => Promise<void>;
  submitLabel?: string;
}

const ServiceRequestForm = ({ onSubmit, submitLabel = "Create Request" }: ServiceRequestFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      title: "",
      eventName: "",
      eventDate: "",
      location: "",
      serviceType: "CATERING",
      description: "",
      budget: 0,
    },
  });

  const handleSubmit = async (data: ServiceRequestFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      toast({
        title: "Success",
        description: "Service request created successfully",
      });
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create request";
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter request title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter event name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Enter event location" {...field} />
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe your requirements" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter your budget"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
};

export default ServiceRequestForm; 