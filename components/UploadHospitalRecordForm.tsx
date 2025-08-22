"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// validation schema
// form validation done with Zod
const formSchema = z.object({
  title: z.string().min(3, "Record title must be at least 3 characters."),
  file: z
    .any()
    .refine((files) => files?.length === 1, "Please upload exactly one file."),
});

type FormValues = z.infer<typeof formSchema>;

export default function UploadHospitalRecordForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      file: undefined,
    },
  });

  function onSubmit(values: FormValues) {
    const file = values.file[0];
    console.log("Record Title:", values.title);
    console.log("Selected File:", file);
    // TODO: Replace with IPFS upload + StarkNet call later
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-3/5 space-y-4 mt-8">
        {/* Record Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xl">Record Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., X-ray Document, Patient Medicine Presciption"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload */}
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-2xl">Upload File</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  onChange={(e) => field.onChange(e.target.files)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button type="submit" className="flex justify-start bg-blue-300 text-white font-bold px-5 py-3 transition-colors ease-in-out hover:bg-blue-400">
          Create Record
        </Button>
      </form>
    </Form>
  );
}
