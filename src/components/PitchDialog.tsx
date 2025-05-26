import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { pitchService } from "@/services/pitchService";

const pitchSchema = z.object({
  pitchDetails: z.string().min(10, "Please provide detailed pitch information"),
  proposedPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Please enter a valid price",
  }),
});

type PitchFormData = z.infer<typeof pitchSchema>;

interface PitchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number;
  onSuccess?: () => void;
}

const PitchDialog = ({ isOpen, onClose, requestId, onSuccess }: PitchDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PitchFormData>({
    resolver: zodResolver(pitchSchema),
    defaultValues: {
      pitchDetails: "",
      proposedPrice: "",
    },
  });

  const onSubmit = async (data: PitchFormData) => {
    try {
      setIsSubmitting(true);
      await pitchService.createPitch({
        requestId,
        pitchDetails: data.pitchDetails,
        proposedPrice: Number(data.proposedPrice),
      });

      toast({
        title: "Success",
        description: "Your pitch has been submitted successfully",
      });

      form.reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit pitch",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit a Pitch</DialogTitle>
          <DialogDescription>
            Provide details about your service and proposed price for this request.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pitchDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pitch Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your service, experience, and why you're the best fit..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proposedPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposed Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter your proposed price"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Pitch"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PitchDialog; 