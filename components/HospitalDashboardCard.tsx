export default function HospitalDashboardCard({ name, num, percent }: { name: string; num?: string; percent?: string }) {
  return (
    <div className="border-1 border-blue-400 w-[17vw] h-[17vh] flex flex-col justify-center px-3 gap-y-3 rounded-lg">
      <span className="text-xl font-medium">{name}</span>
      <span className="text-xl font-bold">{num}</span>
        {percent && <span className="text-sm text-gray-600">Progress: {percent}</span>}
    </div>
  );
}