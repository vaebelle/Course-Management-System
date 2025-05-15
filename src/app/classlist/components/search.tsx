import { Input } from "../../../components/ui/input";

export default function Search() {
  return (
    <div className="flex justify-center mt-8">
      <Input
        type="text"
        placeholder="Search for a student..."
        className="w-1/4 p-2 border border-gray-300 rounded"
      />
    </div>
  );
}
