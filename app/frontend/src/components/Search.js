import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import '../css/Search.css';
import "bootstrap-icons/font/bootstrap-icons.css";

import BasicSearch from './BasicSearch';
import AdvancedSearch from './AdvancedSearch';
import Loading from './Loading';
import SearchContext from './SearchContext';

function Search() {
  const sentenceListRef = useRef([]);
  const [advanced, setAdvanced] = useState(false);
  const [sentenceFileNames, setSentenceFileNames] = useState([]);
  const [fileSelection, setFileSelection] = useState('')
  const [filteredSentences, setFilteredSentences] = useState([]);
  const [searchData, setSearchData] = useState({ basicSearch: { phrase: '' }, advancedSearch: { words: [{word: '', length: ''}], avgWordLength: 0, minWords: 0 }});
  const value = { searchData, setSearchData };

  useEffect(async () => {
    const sentenceFileNames = await axios.get('/files/sentences/names');
    setSentenceFileNames(sentenceFileNames.data.fileNames);
  }, [])

  const toggleAdvanced = () => {
    setAdvanced(!advanced)
  }

  const loadSentences = async () => {
    const res = await axios.get(`/files/sentences/${fileSelection}`);
    sentenceListRef.current = res.data;
  }

  const formatSentences = (sentences) => {
    return sentences.map((sentence) => {
      return sentence.split(" ").map((word) => { 
        return {"word":word,"length": word.length}
      })
    })
  }

  const matchAdvancedPattern = (formattedSentences) => {
    return formattedSentences.filter((sentence) => {
      if (sentence.length < searchData.advancedSearch.minWords || (sentence.reduce((a,b) => a+b.length,0)/sentence.length) < searchData.advancedSearch.avgWordLength) {
        return false
      }
      else {
        for (let i = 0; i < searchData.advancedSearch.words.length; i++) {
          if (searchData.advancedSearch.words[i].word !== "" && sentence[i].word !== searchData.advancedSearch.words[i].word ||
              searchData.advancedSearch.words[i].word === "" && searchData.advancedSearch.words[i].length !== sentence[i].length) {
            return false
        }}
        return true}})
  }

  const search = async (event) => {
    event.preventDefault();

    if(sentenceListRef.current.length === 0) {
      await loadSentences();
    }

    if (advanced) {
      setFilteredSentences(matchAdvancedPattern(formatSentences(sentenceListRef.current)))
    } else {
      setFilteredSentences(sentenceListRef.current.filter((sentence) => {
        return sentence.includes(searchData.basicSearch.phrase)
      }))
    }
  }

  const changeFileSelection = (event) => {
    setFileSelection(event.target.value);
  }

  return (
    <SearchContext.Provider value={value}>
      <div className="mt-3">
          <form>
              <p className="display-3 text-center">חיפוש</p>
              <div className="form-group col-6 mb-5 mx-auto text-center">
                <label htmlFor="sentenceFileSelect">בחר טקסט לחיפוש משפטים: </label>
                <select className="form-control" id="sentenceFileSelect" onChange={changeFileSelection}>
                  <option value='' selected disabled hidden>בחר כאן</option>
                  {
                    sentenceFileNames.map((fileName, index) => {
                      const data = fileName.replace(/\.[^/.]+$/, "").split('-');
                      const text = data[0];
                      const lexicon = data[1];
                      const offset = data[2];

                      return(<option value={fileName} key={text+lexicon+offset}>הטקסט {text} עם הלקסיקון {lexicon} בדילוג {offset} אותיות</option>);
                    })
                  }
                </select>
              </div>
              <div className="accordion" id="accordion">
              <BasicSearch></BasicSearch>
              <AdvancedSearch></AdvancedSearch>
              </div>
              <div className="d-flex justify-content-between">
              <button type="submit" onClick={search} className="btn btn-success" data-bs-toggle="modal" data-bs-target="#searchLoading">חפש</button>
              <button type="button" onClick={toggleAdvanced} data-bs-toggle="collapse" data-bs-target=".search" className={`btn ${advanced ? "btn-info" : "btn-danger"}`} aria-expanded="false" aria-controls="basicSearch advancedSearch">{advanced ? "חיפוש בסיסי" : "חיפוש מתקדם"}</button>
              </div>
          </form>
          <Loading message="החיפוש מתבצע כעת..." id="searchLoading"></Loading>
      </div>
    </SearchContext.Provider>
  );
}

export default Search;