import ShowCard from "./ShowCard";

function ShowList({ shows, refresh }) {
  return (
    <div className="p-4 grid gap-6 justify-center sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {shows.map((show) => (
        <ShowCard key={show._id} show={show} refresh={refresh} />
      ))}
    </div>
  );
}

export default ShowList;
