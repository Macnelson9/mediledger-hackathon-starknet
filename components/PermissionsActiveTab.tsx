export default function PermissionsActiveTab({
  name,
  day,
  time,
  requestId,
  onRevoke,
}: {
  name: string;
  day: string;
  time: string;
  requestId: number;
  onRevoke: (id: number) => void;
}) {
  return (
    <div className="w-[805px] h-[69px] mt-3 flex justify-between opacity-100 rounded-xl border px-6 py-3">
      <div className="flex flex-col justify-between">
        <p className="font-medium text-sm leading-none tracking-normal">
          {name}
        </p>
        <p className="w-[95px] h-3 gap-[10px] opacity-100 flex flex-row">
          <span className="font-normal text-[8px] leading-none tracking-normal">
            {day}
          </span>
          <span className="font-normal text-[8px] leading-none tracking-normal">
            {time}
          </span>
        </p>
      </div>
      <button
        onClick={() => onRevoke(requestId)}
        className="w-[75px] h-[37px] gap-[10px] opacity-100 rounded-lg px-3 py-2 bg-[#FBE8EF] border border-[#D81B60] text-[#D81B60] flex justify-center items-center"
      >
        Revoke
      </button>
    </div>
  );
}
