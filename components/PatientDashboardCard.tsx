export default function PatientDashboardCard({name, num}: {name: string, num?: string}) {
    return(
        <div className="border-1 border-blue-400 w-[17vw] h-[17vh] flex flex-col justify-center px-3 gap-y-6 rounded-lg">
            <span className="text-xl font-medium">{name}</span>
            <span className="text-xl font-bold">{num}</span>
        </div>
    )
}