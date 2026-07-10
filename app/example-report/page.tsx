import { redirect } from "next/navigation";
import { demoReportSlug } from "@/lib/demo-report";

export default function ExampleReportPage() {
  redirect(`/report/${demoReportSlug}`);
}
