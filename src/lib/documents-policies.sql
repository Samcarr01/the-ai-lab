-- RLS Policies for documents table

-- Allow authenticated users to insert documents
CREATE POLICY "Authenticated users can insert documents" ON public.documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public read access to documents (for all users to see previews)
CREATE POLICY "Public can read documents" ON public.documents
  FOR SELECT USING (true);

-- Allow authenticated users to update documents (for admin operations)
CREATE POLICY "Authenticated users can update documents" ON public.documents
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow service role to manage all documents (for admin operations)
CREATE POLICY "Service role can manage all documents" ON public.documents
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for gpts table (if needed)

-- Allow authenticated users to insert GPTs
CREATE POLICY "Authenticated users can insert gpts" ON public.gpts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public read access to GPTs (for all users to see previews)
CREATE POLICY "Public can read gpts" ON public.gpts
  FOR SELECT USING (true);

-- Allow authenticated users to update GPTs (for admin operations)
CREATE POLICY "Authenticated users can update gpts" ON public.gpts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow service role to manage all GPTs (for admin operations)
CREATE POLICY "Service role can manage all gpts" ON public.gpts
  FOR ALL USING (auth.role() = 'service_role');