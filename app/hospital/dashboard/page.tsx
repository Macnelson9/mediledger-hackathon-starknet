import HospitalDashboardCard from "@/components/HospitalDashboardCard";
export default function HospitalDashboardPage() {
  return (
    <div className="">
      <h1 className="font-bold text-5xl leading-none tracking-normal">
        Medical Records Dashboard
      </h1>
      <div className="mt-4">
        <h2 className="text-2xl">
          Verify and store patients records in seconds.
        </h2>
      </div>
      <div className="flex flex-col mt-8">
        <h3 className="text-3xl font-semibold">Overview</h3>
        <div className="flex flex-wrap gap-4 mt-4">
          <HospitalDashboardCard name="Patients" num="1120" percent="25" />
          <HospitalDashboardCard name="Records" num="2400" percent="15" />
          <HospitalDashboardCard name="Verified" num="2120" percent="25" />
          <HospitalDashboardCard name="Stored" num="2120" percent="45" />
        </div>
      </div>
      <div className="flex flex-col mt-8">
        <h3 className="text-3xl font-semibold">Recent Activities</h3>
      </div>
    </div>
  );
}
