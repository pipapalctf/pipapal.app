import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Scale, CircleDollarSign, MessageSquare } from 'lucide-react';
import { Collection } from '@shared/schema';

// Form schema
const formSchema = z.object({
  amountRequested: z.number()
    .min(0.1, 'Amount must be at least 0.1 kg')
    .refine(val => val > 0, {
      message: 'Amount must be greater than 0',
    }),
  pricePerKg: z.number()
    .min(1, 'Price must be at least KSh 1 per kg')
    .refine(val => val > 0, {
      message: 'Price must be greater than 0',
    }),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpressInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection | null;
  onSubmit: (data: FormValues & { collectionId: number }) => void;
  isSubmitting: boolean;
}

export function ExpressInterestDialog({
  open,
  onOpenChange,
  collection,
  onSubmit,
  isSubmitting,
}: ExpressInterestDialogProps) {
  const [totalValue, setTotalValue] = useState<number>(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amountRequested: collection?.wasteAmount || 1,
      pricePerKg: 20, // Default price
      message: '',
    },
  });

  // Update form default values when collection changes
  useEffect(() => {
    if (collection) {
      form.setValue('amountRequested', collection.wasteAmount || 1);
    }
  }, [collection, form]);

  // Calculate total value when amount or price changes
  useEffect(() => {
    const amount = form.watch('amountRequested');
    const price = form.watch('pricePerKg');
    
    if (amount && price) {
      setTotalValue(amount * price);
    } else {
      setTotalValue(0);
    }
  }, [form.watch('amountRequested'), form.watch('pricePerKg'), form]);

  const handleFormSubmit = (data: FormValues) => {
    if (!collection) return;
    
    onSubmit({
      ...data,
      collectionId: collection.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Express Interest in Materials</DialogTitle>
          <DialogDescription>
            Provide details about your interest in the collected materials.
          </DialogDescription>
        </DialogHeader>

        {collection && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-md mb-4">
                <h3 className="text-sm font-medium mb-2">Material Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Material Type:</span>
                    <p className="font-medium capitalize">{collection.wasteType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Available Amount:</span>
                    <p className="font-medium">{collection.wasteAmount} kg</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium">{collection.address}</p>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="amountRequested"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Requested (kg)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="Enter amount in kg"
                          className="pl-10"
                          step="0.1"
                          min="0.1"
                          max={collection.wasteAmount || undefined}
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {collection.wasteAmount 
                        ? `Maximum available: ${collection.wasteAmount} kg` 
                        : 'Enter the amount you wish to purchase'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricePerKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Per Kg (KSh)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CircleDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="Enter price per kg"
                          className="pl-10"
                          step="0.5"
                          min="1"
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Offer a fair price based on the material type and quality
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {totalValue > 0 && (
                <div className="bg-primary/10 p-3 rounded-md flex items-center justify-between">
                  <span className="text-sm font-medium">Total Offer Value:</span>
                  <span className="text-lg font-bold text-primary">KSh {totalValue.toFixed(2)}</span>
                </div>
              )}

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Message (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          placeholder="Add any additional information or requirements"
                          className="pl-10 min-h-[100px]"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Include details such as timeframe, transportation requirements, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    'Express Interest'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}