import { createClient } from "@supabase/supabase-js";

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("List error:", listError.message);
    return;
  }
  console.log("Existing buckets:", buckets?.map((b) => b.name).join(", ") || "none");

  const exists = buckets?.some((b) => b.name === "client-uploads");
  if (exists) {
    console.log("Bucket already exists");
    return;
  }

  const { error: createError } = await supabase.storage.createBucket("client-uploads", {
    public: true,
  });
  if (createError) {
    console.error("Create error:", createError.message);
    return;
  }
  console.log("Bucket created");
}

main();
