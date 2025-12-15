// import { useEffect, useState } from "react";
// import { Header } from "@/components/Header";
// import { Footer } from "@/components/Footer";
// import { FighterCard } from "@/components/FighterCard";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Search, Loader2, FilterX } from "lucide-react";
// import { Division, Fighter } from "@/types/fighter";
// import apiClient from "@/api/apiClient";
// import { useAuthStore } from "@/stores/authStore";
// import { useDebounce } from "@/hooks/debounce";

// interface FighterWithUserId extends Fighter {
//   user_id?: number;
// }

// const Fighters = () => {
//   const [fighters, setFighters] = useState<FighterWithUserId[]>([]);
//   const [divisions, setDivisions] = useState<Division[]>([]);

//   const [searchQuery, setSearchQuery] = useState("");
//   const debouncedSearch = useDebounce(searchQuery, 500);

//   const [selectedDivision, setSelectedDivision] = useState<string>("all");
//   const [selectedGender, setSelectedGender] = useState<string>("all");

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const userType = useAuthStore((s) => s.userType);
//   const currentUser = useAuthStore((s) => s.currentUser);

//   useEffect(() => {
//     apiClient
//       .get<Division[]>("/divisions")
//       .then((res) => setDivisions(res.data))
//       .catch((err) => console.error("Failed divisions fetch", err));
//   }, []);

//   useEffect(() => {
//     const fetchFighters = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const params = new URLSearchParams();
//         if (debouncedSearch) params.append("search", debouncedSearch);
//         if (selectedDivision !== "all")
//           params.append("division", selectedDivision);
//         if (selectedGender !== "all") params.append("gender", selectedGender);

//         params.append("sortBy", "ranking");

//         const res = await apiClient.get<FighterWithUserId[]>(
//           `/fighters?${params.toString()}`
//         );

//         let data = res.data;
//         if (userType === "FIGHTER" && currentUser?.id) {
//           data = data.filter((f) => f.user_id !== currentUser.id);
//         }

//         setFighters(data);
//       } catch (err) {
//         setError("Unable to load fighters.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFighters();
//   }, [
//     debouncedSearch,
//     selectedDivision,
//     selectedGender,
//     userType,
//     currentUser?.id,
//   ]);

//   useEffect(() => {
//     if (selectedDivision === "all" || selectedGender === "all") return;

//     const currentDiv = divisions.find((d) => d.name === selectedDivision);
//     if (currentDiv && currentDiv.gender !== selectedGender) {
//       setSelectedDivision("all");
//     }
//   }, [selectedGender, divisions, selectedDivision]);

//   const availableDivisions = divisions.filter((d) => {
//     if (selectedGender === "all") return true;
//     return d.gender === selectedGender;
//   });

//   return (
//     <div className="min-h-screen flex flex-col bg-background">
//       <Header />

//       <main className="flex-1">
//         <section className="py-12 bg-muted/30 border-b">
//           <div className="container">
//             <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
//               Roster <span className="text-primary">Exploration</span>
//             </h1>
//             <p className="text-xl text-muted-foreground">
//               Discover the next generation of champions across all weight
//               classes.
//             </p>
//           </div>
//         </section>

//         <section className="py-6 border-b sticky top-16 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
//           <div className="container flex flex-col md:flex-row gap-4">
//             <div className="relative flex-1">
//               <Input
//                 placeholder="Search by name or country..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-10 bg-muted/50 border-muted-foreground/20"
//               />
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
//             </div>

//             <Select
//               value={selectedDivision}
//               onValueChange={setSelectedDivision}
//             >
//               <SelectTrigger className="w-full md:w-[240px] bg-muted/50 border-muted-foreground/20">
//                 <SelectValue placeholder="Filter by Division" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Divisions</SelectItem>
//                 {availableDivisions.map((division) => (
//                   <SelectItem key={division.id} value={division.name}>
//                     {division.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         </section>

//         <section className="py-10">
//           <div className="container">
//             <Tabs
//               defaultValue="all"
//               className="w-full"
//               onValueChange={(val) => setSelectedGender(val)}
//             >
//               <TabsList className="mb-8 ">
//                 <TabsTrigger value="all">All Fighters</TabsTrigger>
//                 <TabsTrigger value="male">Men</TabsTrigger>
//                 <TabsTrigger value="female">Women</TabsTrigger>
//               </TabsList>

//               {error && (
//                 <div className="flex flex-col items-center justify-center py-12 text-destructive">
//                   <FilterX className="h-10 w-10 mb-2 opacity-50" />
//                   <p className="text-lg font-medium">{error}</p>
//                 </div>
//               )}

//               {loading ? (
//                 <div className="flex flex-col items-center justify-center py-20 gap-4">
//                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
//                   <p className="text-muted-foreground">Scouting fighters...</p>
//                 </div>
//               ) : (
//                 <div className="w-full">
//                   {fighters.length > 0 ? (
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                       {fighters.map((fighter) => (
//                         <FighterCard key={fighter.id} {...fighter} />
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
//                       <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
//                       <h3 className="text-lg font-semibold">
//                         No fighters found
//                       </h3>
//                       <p className="text-muted-foreground">
//                         Try adjusting your search or filters.
//                       </p>
//                       {(selectedDivision !== "all" || searchQuery) && (
//                         <button
//                           onClick={() => {
//                             setSelectedDivision("all");
//                             setSearchQuery("");
//                           }}
//                           className="mt-4 text-primary hover:underline text-sm font-medium"
//                         >
//                           Clear all filters
//                         </button>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               )}
//             </Tabs>
//           </div>
//         </section>
//       </main>

//       <Footer />
//     </div>
//   );
// };

// export default Fighters;
import { useEffect, useState, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FighterCard } from "@/components/FighterCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, FilterX } from "lucide-react";
import { Division, Fighter } from "@/types/fighter";
import apiClient from "@/api/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { useDebounce } from "@/hooks/debounce";

interface FighterWithUserId extends Fighter {
  user_id?: number;
}

interface FightersResponse {
  fighters: FighterWithUserId[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

const Fighters = () => {
  const [fighters, setFighters] = useState<FighterWithUserId[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Loading States
  const [loading, setLoading] = useState(false); // Initial load / Filter change
  const [loadingMore, setLoadingMore] = useState(false); // Infinite scroll load
  const [error, setError] = useState<string | null>(null);

  const userType = useAuthStore((s) => s.userType);
  const currentUser = useAuthStore((s) => s.currentUser);

  // Observer Ref for Infinite Scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  // 1. Fetch Divisions (Once)
  useEffect(() => {
    apiClient
      .get<Division[]>("/divisions")
      .then((res) => setDivisions(res.data))
      .catch((err) => console.error("Failed divisions fetch", err));
  }, []);

  // 2. Main Fetch Function
  const fetchFighters = useCallback(
    async (pageNum: number, isNewFilter: boolean) => {
      if (isNewFilter) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append("search", debouncedSearch);
        if (selectedDivision !== "all")
          params.append("division", selectedDivision);
        if (selectedGender !== "all") params.append("gender", selectedGender);

        params.append("page", pageNum.toString());
        params.append("limit", "10"); // Limit per chunk
        params.append("sortBy", "ranking");

        const res = await apiClient.get<FightersResponse>(
          `/fighters?${params.toString()}`
        );

        let newFighters = res.data.fighters;

        // Hide self if fighter
        if (userType === "FIGHTER" && currentUser?.id) {
          newFighters = newFighters.filter((f) => f.user_id !== currentUser.id);
        }

        setFighters((prev) =>
          isNewFilter ? newFighters : [...prev, ...newFighters]
        );

        // Check if we reached the last page
        setHasMore(pageNum < res.data.pagination.totalPages);
      } catch (err) {
        setError("Unable to load fighters.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      debouncedSearch,
      selectedDivision,
      selectedGender,
      userType,
      currentUser?.id,
    ]
  );

  // 3. Effect: Reset and Fetch when Filters Change
  useEffect(() => {
    setPage(1);
    setFighters([]); // Clear list immediately to show loading state correctly
    setHasMore(true);
    fetchFighters(1, true);
  }, [debouncedSearch, selectedDivision, selectedGender, fetchFighters]);

  // 4. Effect: Infinite Scroll (Load More)
  useEffect(() => {
    // Don't setup observer if we are loading, or no more data, or on page 1 (handled by filter effect)
    if (loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => {
            const nextPage = prev + 1;
            fetchFighters(nextPage, false);
            return nextPage;
          });
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the loader is visible
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [loading, loadingMore, hasMore, fetchFighters]);

  // 5. Smart Division Reset logic
  useEffect(() => {
    if (selectedDivision === "all" || selectedGender === "all") return;
    const currentDiv = divisions.find((d) => d.name === selectedDivision);
    if (currentDiv && currentDiv.gender !== selectedGender) {
      setSelectedDivision("all");
    }
  }, [selectedGender, divisions, selectedDivision]);

  const availableDivisions = divisions.filter((d) => {
    if (selectedGender === "all") return true;
    return d.gender === selectedGender;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="py-12 bg-muted/30 border-b">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
              Roster <span className="text-primary">Exploration</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover the next generation of champions across all weight
              classes.
            </p>
          </div>
        </section>

        <section className="py-6 border-b sticky top-16 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search by name or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-muted-foreground/20"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            <Select
              value={selectedDivision}
              onValueChange={setSelectedDivision}
            >
              <SelectTrigger className="w-full md:w-[240px] bg-muted/50 border-muted-foreground/20">
                <SelectValue placeholder="Filter by Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {availableDivisions.map((division) => (
                  <SelectItem key={division.id} value={division.name}>
                    {division.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="py-10">
          <div className="container">
            <Tabs
              defaultValue="all"
              className="w-full"
              onValueChange={(val) => setSelectedGender(val)}
            >
              <TabsList className="mb-8">
                <TabsTrigger value="all">All Fighters</TabsTrigger>
                <TabsTrigger value="male">Men</TabsTrigger>
                <TabsTrigger value="female">Women</TabsTrigger>
              </TabsList>

              {error && (
                <div className="flex flex-col items-center justify-center py-12 text-destructive">
                  <FilterX className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-lg font-medium">{error}</p>
                </div>
              )}

              {/* Initial Loading (Full Page Spinner) */}
              {loading && fighters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Scouting fighters...</p>
                </div>
              ) : (
                <div className="w-full">
                  {fighters.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {fighters.map((fighter) => (
                          <FighterCard key={fighter.id} {...fighter} />
                        ))}
                      </div>

                      {/* Infinite Scroll Loader / Trigger */}
                      {hasMore && (
                        <div
                          ref={observerTarget}
                          className="flex justify-center items-center py-8 mt-4"
                        >
                          {loadingMore && (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          )}
                        </div>
                      )}

                      {/* {!hasMore && fighters.length > 0 && (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                          You've reached the end of the roster.
                        </div>
                      )} */}
                    </>
                  ) : (
                    // Empty State
                    <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
                      <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <h3 className="text-lg font-semibold">
                        No fighters found
                      </h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search or filters.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedDivision("all");
                          setSearchQuery("");
                        }}
                        className="mt-4 text-primary hover:underline text-sm font-medium"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Fighters;
