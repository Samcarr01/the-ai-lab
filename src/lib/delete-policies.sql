-- Add DELETE policies for documents and gpts tables

-- Allow authenticated users to delete documents
CREATE POLICY "Authenticated users can delete documents" ON public.documents
  FOR DELETE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete GPTs  
CREATE POLICY "Authenticated users can delete gpts" ON public.gpts
  FOR DELETE USING (auth.role() = 'authenticated');

-- Alternative: Allow service role to delete everything (if the above doesn't work)
CREATE POLICY "Service role can delete all documents" ON public.documents
  FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete all gpts" ON public.gpts
  FOR DELETE USING (auth.role() = 'service_role');